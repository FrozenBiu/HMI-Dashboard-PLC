const nodes7 = require("nodes7");
const VARIABLES = require("../config/plcMap");
const dbService = require("./dbService");

const conn = new nodes7();

// Biến lưu trạng thái cũ (Fix chuẩn tên biến theo logic của em)
let prevStates = {
  resetSCL: false,
  historyBypass: false,
  eventCounter: 0,
};

// Biến toàn cục để quản lý vòng lặp đọc, giúp dừng đọc khi rớt mạng
let readInterval = null;

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
  console.log(`🔌 Đang thử kết nối tới PLC tại địa chỉ: ${PLC_CONFIG.host}...`);

  conn.initiateConnection(PLC_CONFIG, (err) => {
    // TRƯỜNG HỢP 1: KHÔNG THỂ KẾT NỐI LÚC VỪA KHỞI ĐỘNG
    if (err) {
      console.log(`⏳ Không tìm thấy PLC (${PLC_CONFIG.host}). Hệ thống đang chờ và sẽ thử lại sau 5 giây...`);
      // Đợi 5 giây rồi tự động gọi lại chính hàm này (Không dùng process.exit nữa)
      setTimeout(() => {
        initPLC(PLC_CONFIG, io);
      }, 5000);
      return; // Dừng luồng hiện tại
    }

    console.log("✅ ĐÃ KẾT NỐI PLC THÀNH CÔNG! Đang stream dữ liệu...");
    
    // Chỉ khai báo vùng nhớ khi đã kết nối thành công
    conn.setTranslationCB((tag) => VARIABLES[tag]);
    conn.addItems(["TRACKING_BLOCK", "FLAG_M", "RESET_CMD_WEB", "PARAMETERS_BLOCK"]);

    // Đảm bảo không bị trùng lặp vòng lặp nếu kết nối lại nhiều lần
    if (readInterval) clearInterval(readInterval);

    // Vòng lặp đọc dữ liệu liên tục
    readInterval = setInterval(() => {
      conn.readAllItems((err, values) => {
        // TRƯỜNG HỢP 2: ĐANG CHẠY THÌ BỊ RÚT DÂY MẠNG / PLC CÚP ĐIỆN
        if (err) {
          console.error("⚠️ MẤT KẾT NỐI VỚI PLC! Đang dừng đọc và thử kết nối lại...");
          clearInterval(readInterval); // Tắt vòng lặp đọc hiện tại
          
          // Xóa kết nối cũ bị kẹt và gọi lại hàm kết nối từ đầu
          conn.dropConnection(() => {
            setTimeout(() => {
              initPLC(PLC_CONFIG, io);
            }, 3000);
          });
          return;
        }

        // --- BẮT ĐẦU PHẦN BÓC TÁCH BUFFER (Giữ nguyên code cũ của em) ---
        const rawBuffer = values.TRACKING_BLOCK;
        const paramBuffer = values.PARAMETERS_BLOCK;

        if (rawBuffer && rawBuffer.length >= 134 && paramBuffer && paramBuffer.length >= 32) {
          const safeRawBuffer = Buffer.from(rawBuffer);
          const trackingArray = parseS7BufferToBits(rawBuffer.slice(0, 118), 944);
          
          const alarm1 = (safeRawBuffer[118] & (1 << 0)) !== 0;
          const alarm2 = (safeRawBuffer[118] & (1 << 1)) !== 0;
          const lineSpeed = safeRawBuffer.readFloatBE(120);
          
          const trigReject = (safeRawBuffer[124] & (1 << 0)) !== 0;
          const trigOverload = (safeRawBuffer[124] & (1 << 1)) !== 0;
          const resetSCL = (safeRawBuffer[124] & (1 << 2)) !== 0;
          const historyBypass = (safeRawBuffer[124] & (1 << 3)) !== 0;
          const firstScan = (safeRawBuffer[124] & (1 << 4)) !== 0;

          const productFaultLength = safeRawBuffer.readFloatBE(126);
          const errorCode = safeRawBuffer.readInt16BE(130);
          const eventCounter = safeRawBuffer.readInt16BE(132);

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

          io.emit("plc_data", {
            trackingData: trackingArray, alarm1, alarm2, resetSCL, historyBypass, firstScan, lineSpeed,
            flagM: values.FLAG_M, parameters: parsedParams,
          });

          // LOGIC GHI LOG BẰNG EVENT COUNTER
          if (eventCounter !== prevStates.eventCounter) {
            if (errorCode === 0) dbService.writeSystemLog("The system is ready!", null, io);
            else if (errorCode === 1) dbService.writeSystemLog("Reject Product", productFaultLength, io);
            else if (errorCode === 2) dbService.writeSystemLog("The system is overload!", null, io);
            else if (errorCode === 3) dbService.writeSystemLog("Operator is bypass!", null, io);
            else if (errorCode === 4) dbService.writeSystemLog("Reset system...!", null, io);
          }

          prevStates = { resetSCL, historyBypass, firstScan, eventCounter };
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
