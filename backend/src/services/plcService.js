const nodes7 = require("nodes7");
const VARIABLES = require("../config/plcMap");
const dbService = require("./dbService");

const conn = new nodes7();

// Biến lưu trạng thái cũ (Fix chuẩn tên biến theo logic của em)
let prevStates = {
  trigReject: false,
  trigOverload: false,
  resetSCL: false,
  historyBypass: false,
  firstScan: false,
};

const parseS7BufferToBits = (buffer, totalBits) => {
  const bitArray = [];
  for (let i = 0; i < buffer.length; i++) {
    for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
      if (bitArray.length < totalBits) {
        bitArray.push((buffer[i] & (1 << bitOffset)) !== 0);
      }
    }
  }
  return bitArray;
};

const initPLC = (PLC_CONFIG, io) => {
  conn.initiateConnection(PLC_CONFIG, (err) => {
    if (err) {
      console.error(
        "❌ Lỗi kết nối PLC. Kiểm tra lại dây LAN, IP hoặc PUT/GET:",
        err,
      );
      process.exit();
    }

    console.log("✅ ĐÃ KẾT NỐI PLC THÀNH CÔNG! Đang stream dữ liệu...");
    conn.setTranslationCB((tag) => VARIABLES[tag]);
    conn.addItems([
      "TRACKING_BLOCK",
      "FLAG_M",
      "RESET_CMD_WEB",
      "PARAMETERS_BLOCK",
    ]);

    setInterval(() => {
      conn.readAllItems((err, values) => {
        if (err) {
          console.error("Lỗi đọc dữ liệu PLC:", err);
          return;
        }

        const rawBuffer = values.TRACKING_BLOCK;
        const paramBuffer = values.PARAMETERS_BLOCK;

        if (
          rawBuffer &&
          rawBuffer.length >= 130 &&
          paramBuffer &&
          paramBuffer.length >= 32
        ) {
          const safeRawBuffer = Buffer.from(rawBuffer);
          const trackingArray = parseS7BufferToBits(
            rawBuffer.slice(0, 118),
            944,
          );

          const alarm1 = (safeRawBuffer[118] & (1 << 0)) !== 0;
          const alarm2 = (safeRawBuffer[118] & (1 << 1)) !== 0;
          const lineSpeed = safeRawBuffer.readFloatBE(120);

          const trigReject = (safeRawBuffer[124] & (1 << 0)) !== 0;
          const trigOverload = (safeRawBuffer[124] & (1 << 1)) !== 0;
          const resetSCL = (safeRawBuffer[124] & (1 << 2)) !== 0;
          const historyBypass = (safeRawBuffer[124] & (1 << 3)) !== 0;
          const firstScan = (safeRawBuffer[124] & (1 << 4)) !== 0;
          const productFaultLength = safeRawBuffer.readFloatBE(126);

          const safeParamBuffer = Buffer.from(paramBuffer);
          const parsedParams = {
            PRODUCT_LENGTH: safeParamBuffer.readFloatBE(0),
            DIAMETER_SENSOR: safeParamBuffer.readFloatBE(4),
            ENCODER_PULSE: safeParamBuffer.readFloatBE(8),
            DIAMETER_PRODUCT: safeParamBuffer.readFloatBE(12),
            FILTER_TRIGGER: safeParamBuffer.readFloatBE(16),
            TIMER_REJECT: safeParamBuffer.readInt32BE(20),
            SENSOR_TO_ALARM1_DISTANCE: safeParamBuffer.readFloatBE(24),
            SENSOR_TO_ALARM2_DISTANCE: safeParamBuffer.readFloatBE(28),
            STEP: safeParamBuffer.readFloatBE(32),
          };

          // Phát sóng dữ liệu lên React
          io.emit("plc_data", {
            trackingData: trackingArray,
            alarm1,
            alarm2,
            resetSCL,
            historyBypass,
            firstScan,
            lineSpeed,
            flagM: values.FLAG_M,
            parameters: parsedParams,
          });

          // LOGIC BẮT SƯỜN LÊN ĐỂ GHI LOG (Truyền thêm 'io' để bắn data lên Web)
          if (trigReject && !prevStates.trigReject)
            dbService.writeSystemLog("Reject Product", productFaultLength, io);
          if (trigOverload && !prevStates.trigOverload)
            dbService.writeSystemLog("The system is overload!", null, io);
          if (resetSCL && !prevStates.resetSCL)
            dbService.writeSystemLog("Reset system...!", null, io);
          if (historyBypass && !prevStates.historyBypass)
            dbService.writeSystemLog("Operator is bypass!", null, io);
          if (firstScan && !prevStates.firstScan)
            dbService.writeSystemLog("The system is ready!", null, io);

          prevStates = {
            trigReject,
            trigOverload,
            resetSCL,
            historyBypass,
            firstScan,
          };
        }
      });
    }, 100);
  });
};

const writeCommand = (commandTag) => {
  console.log(`⚡ Nhận lệnh kích xung từ Web: [${commandTag}]`);
  conn.writeItems(commandTag, true, (err) => {
    if (err) console.error(`❌ Lỗi ghi ${commandTag}:`, err);
    else console.log(`✅ Đã kích hoạt [${commandTag}] thành công!`);
  });
};

const writeParams = (newParams) => {
  console.log("📥 Nhận thông số từ Web, đang đóng gói Buffer 36 bytes...");
  try {
    const buf = Buffer.alloc(36);
    buf.writeFloatBE(newParams.PRODUCT_LENGTH || 0, 0);
    buf.writeFloatBE(newParams.DIAMETER_SENSOR || 0, 4);
    buf.writeFloatBE(newParams.ENCODER_PULSE || 0, 8);
    buf.writeFloatBE(newParams.DIAMETER_PRODUCT || 0, 12);
    buf.writeFloatBE(newParams.FILTER_TRIGGER || 0, 16);
    buf.writeInt32BE(newParams.TIMER_REJECT || 0, 20);
    buf.writeFloatBE(newParams.SENSOR_TO_ALARM1_DISTANCE || 0, 24);
    buf.writeFloatBE(newParams.SENSOR_TO_ALARM2_DISTANCE || 0, 28);
    buf.writeFloatBE(newParams.STEP || 0, 32);

    conn.writeItems("PARAMETERS_BLOCK", Array.from(buf), (err) => {
      if (err) console.error("❌ Lỗi ghi Parameters xuống PLC:", err);
      else console.log("✅ Đã nạp thành công Recipe nguyên khối xuống DB19!");
    });
  } catch (error) {
    console.error("❌ Lỗi trong quá trình đóng gói Buffer:", error);
  }
};

module.exports = { initPLC, writeCommand, writeParams };
