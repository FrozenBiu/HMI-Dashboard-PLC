const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const nodes7 = require("nodes7");
const fs = require("fs"); // MỚI: Gọi thư viện quản lý File của Node.js
const path = require("path");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const conn = new nodes7();

// --- PHỤC VỤ GIAO DIỆN WEB ---
// Tuyệt chiêu: Tự nhận diện đang chạy code gốc (Node) hay chạy file đóng gói (.exe)
const isCompiled = typeof process.pkg !== "undefined";

// Nếu là .exe: Lấy đường dẫn của chính file .exe đó trên máy tính thật
// Nếu code thường: Lấy __dirname (thư mục src)
const distPath = isCompiled
  ? path.join(path.dirname(process.execPath), "dist")
  : path.join(__dirname, "dist");

console.log("📂 Đang tải giao diện Web từ:", distPath);

app.use(express.static(distPath));

// Bắt mọi đường dẫn đều trỏ về file index.html của React (Hỗ trợ Express 5)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// --- DATABASE CỤC BỘ BẰNG FILE JSON ---
const DB_FILE = path.join(process.cwd(), "recipes.json");
// Hàm đọc Database (Nếu file chưa có thì tạo file rỗng)
const loadRecipes = () => {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    console.error("Lỗi đọc DB:", error);
    return {};
  }
};

// Hàm ghi xuống Database
const saveRecipes = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

let savedRecipesDB = loadRecipes(); // Tải DB vào bộ nhớ khi khởi động Server

// --- QUẢN LÝ FILE CẤU HÌNH HỆ THỐNG (config.json) ---
const CONFIG_FILE = path.join(process.cwd(), "config.json");

const loadConfig = () => {
  // Cấu hình mặc định nếu mang xuống xưởng mà lỡ tay xóa mất file config
  const defaultConfig = {
    PLC_IP: "192.168.1.3",
    PLC_PORT: 102,
    PLC_RACK: 0,
    PLC_SLOT: 1,
  };

  try {
    // Nếu chưa có file config.json ở bên ngoài, tự động tạo một file mới
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      console.log(
        "📄 Đã tạo file config.json mặc định. Bạn có thể mở ra để đổi IP!",
      );
    }
    // Đọc file config và parse sang Object
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Lỗi đọc config.json, đang dùng IP mặc định:", error);
    return defaultConfig;
  }
};

// Khởi chạy hàm đọc config ngay khi bật Server
const systemConfig = loadConfig();

// 1. CẤU HÌNH KẾT NỐI PLC (Lấy data động từ systemConfig)
const PLC_CONFIG = {
  port: systemConfig.PLC_PORT,
  host: systemConfig.PLC_IP, // <-- Truyền IP động vào đây
  rack: systemConfig.PLC_RACK,
  slot: systemConfig.PLC_SLOT,
};

console.log(`🔌 Đang kết nối tới PLC tại địa chỉ: ${PLC_CONFIG.host}...`);

// 2. BẢN ĐỒ VÙNG NHỚ
const VARIABLES = {
  // Kiểu Real dùng 'R', kiểu DInt dùng 'D', kiểu Byte thì dùng 'B'
  // Đọc 119 bytes (118 bytes mảng vị trí + 1 byte chứa Alarm1, Alarm2)
  TRACKING_BLOCK: "DB25,B0.124",
  RESET_CMD_WEB: "M202.1",
  FLAG_M: "M50.1", // cờ tín hiệu cho biết alarm1 đã được reset chưa để kích alarm2

  // --- THÊM MAP CHO BẢNG SETTINGS (Giả sử DB Data của em là DB10) ---
  PARAMETERS_BLOCK: "DB19,B0.36",
  // --- CÁC BIẾN LẺ DÙNG ĐỂ GHI XUỐNG PLC ---
  // Node.js cần biết offset của từng biến để chọc đúng vào DB19
  PRODUCT_LENGTH: "DB19,R0",
  DIAMETER_SENSOR: "DB19,R4",
  ENCODER_PULSE: "DB19,R8",
  DIAMETER_PRODUCT: "DB19,R12",
  FILTER_TRIGGER: "DB19,R16",
  TIMER_REJECT: "DB19,D20",
  SENSOR_TO_ALARM1_DISTANCE: "DB19,R24",
  SENSOR_TO_ALARM2_DISTANCE: "DB19,R28",
  STEP: "DB19,R32",

  // 3 Lệnh reset độc lập từ Web
  WEB_CMD_RESET_ALARM: "M206.3",
  WEB_CMD_RESET_PROG: "M206.4",
  WEB_CMD_BYPASS: "M206.5",
};

// 3. HÀM GIẢI MÃ BUFFER THÀNH MẢNG 944 BIT
const parseS7BufferToBits = (buffer, totalBits) => {
  const bitArray = [];
  for (let i = 0; i < buffer.length; i++) {
    let currentByte = buffer[i];
    for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
      if (bitArray.length < totalBits) {
        const isBitSet = (currentByte & (1 << bitOffset)) !== 0;
        bitArray.push(isBitSet);
      }
    }
  }
  return bitArray;
};

// 4. THIẾT LẬP KẾT NỐI VÀ ĐỌC DỮ LIỆU LIÊN TỤC
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

  // Quét PLC mỗi 100ms
  setInterval(() => {
    conn.readAllItems((err, values) => {
      if (err) {
        console.error("Lỗi đọc dữ liệu PLC:", err);
        return;
      }

      const rawBuffer = values.TRACKING_BLOCK;
      const paramBuffer = values.PARAMETERS_BLOCK; // Lấy cục Buffer 32 bytes của DB19

      if (
        rawBuffer &&
        rawBuffer.length >= 124 &&
        paramBuffer &&
        paramBuffer.length >= 32
      ) {
        // 1. Bóc mảng Tracking (Giữ nguyên)
        const trackingArray = parseS7BufferToBits(rawBuffer.slice(0, 118), 944);
        const alarm1 = (rawBuffer[118] & (1 << 0)) !== 0;
        const alarm2 = (rawBuffer[118] & (1 << 1)) !== 0;
        const lineSpeed = rawBuffer.slice(120, 124);

        // 2. FIX LỖI Ở ĐÂY: Ép kiểu mảng thuần thành Node.js Buffer
        const safeParamBuffer = Buffer.from(paramBuffer);

        // 3. Bây giờ safeParamBuffer đã là Buffer xịn, gọi readFloatBE thoải mái!
        const parsedParams = {
          PRODUCT_LENGTH: safeParamBuffer.readFloatBE(0),
          DIAMETER_SENSOR: safeParamBuffer.readFloatBE(4),
          ENCODER_PULSE: safeParamBuffer.readFloatBE(8),
          DIAMETER_PRODUCT: safeParamBuffer.readFloatBE(12),
          FILTER_TRIGGER: safeParamBuffer.readFloatBE(16),
          TIMER_REJECT: safeParamBuffer.readInt32BE(20), // DInt là Int32
          SENSOR_TO_ALARM1_DISTANCE: safeParamBuffer.readFloatBE(24),
          SENSOR_TO_ALARM2_DISTANCE: safeParamBuffer.readFloatBE(28),
          STEP: safeParamBuffer.readFloatBE(32),
        };

        // 4. Phát sóng lên React
        io.emit("plc_data", {
          trackingData: trackingArray,
          alarm1: alarm1,
          alarm2: alarm2,
          lineSpeed: lineSpeed,
          flagM: values.FLAG_M,
          parameters: parsedParams,
        });
      }
    });
  }, 100);
});

// 5. NHẬN LỆNH ĐIỀU KHIỂN TỪ WEB
io.on("connection", (socket) => {
  console.log(`💻 Web Client connected: ${socket.id}`);

  // MỚI: Ngay khi có người mới vào Web, lập tức gửi bộ Recipe trong DB cho họ
  socket.emit("update_recipes", savedRecipesDB);

  // --- MỚI: CÁC API QUẢN LÝ RECIPE TỪ WEB ---
  // 1. Lưu Recipe mới vào DB
  socket.on("save_recipe", (payload) => {
    const { name, parameters } = payload;
    savedRecipesDB[name] = parameters; // Cập nhật trên RAM
    saveRecipes(savedRecipesDB); // Ghi đè xuống ổ cứng máy chủ

    // Phát thanh bản cập nhật DB cho TẤT CẢ các thiết bị đang mở Web
    io.emit("update_recipes", savedRecipesDB);
    console.log(`💾 Đã lưu Recipe [${name}] vào Database cục bộ.`);
  });

  // 2. Xóa Recipe khỏi DB
  socket.on("delete_recipe", (name) => {
    delete savedRecipesDB[name];
    saveRecipes(savedRecipesDB);
    io.emit("update_recipes", savedRecipesDB); // Đồng bộ lại cho mọi người
    console.log(`🗑️ Đã xóa Recipe [${name}] khỏi Database.`);
  });

  // NHẬN 3 LỆNH ĐIỀU KHIỂN RỜI RẠC
  socket.on("write_plc_command", (commandTag) => {
    console.log(`⚡ Nhận lệnh kích xung từ Web: [${commandTag}]`);

    // Ghi 1 lệnh TRUE duy nhất
    conn.writeItems(commandTag, true, (err) => {
      if (err) console.error(`❌ Lỗi ghi ${commandTag}:`, err);
      else console.log(`✅ Đã kích hoạt [${commandTag}] thành công!`);
    });
  });
  // NHẬN LỆNH RESET_CMD TỪ WEB
  // socket.on("write_plc", (payload) => {
  //   if (payload.tag === "RESET_CMD") {
  //     console.log(`Nhận lệnh Web: Ghi [${payload.value}] xuống DB25.DBX118.2`);

  //     // FIX LỖI Ở ĐÂY: Truyền chuỗi Tag Name "RESET_CMD_WEB" thay vì truyền thẳng địa chỉ
  //     conn.writeItems("RESET_CMD_WEB", payload.value, (err) => {
  //       if (err) console.error("❌ Lỗi ghi PLC:", err);
  //     });
  //   }
  // });

  // NHẬN LỆNH LƯU SETTINGS TỪ WEB (TỐI ƯU HÓA: BLOCK WRITE)
  socket.on("write_parameters", (newParams) => {
    console.log("📥 Nhận thông số từ Web, đang đóng gói Buffer 36 bytes...");

    try {
      // 1. Tạo một hộp chứa (Buffer) trống có kích thước đúng 32 bytes
      const buf = Buffer.alloc(36);

      // 2. Nhét từng con số vào đúng vị trí Byte (Offset) của nó
      // Lưu ý: writeFloatBE dùng cho số Real, writeInt32BE dùng cho DInt
      buf.writeFloatBE(newParams.PRODUCT_LENGTH || 0, 0); // Offset 0
      buf.writeFloatBE(newParams.DIAMETER_SENSOR || 0, 4); // Offset 4
      buf.writeFloatBE(newParams.ENCODER_PULSE || 0, 8); // Offset 8
      buf.writeFloatBE(newParams.DIAMETER_PRODUCT || 0, 12); // Offset 12
      buf.writeFloatBE(newParams.FILTER_TRIGGER || 0, 16); // Offset 16

      buf.writeInt32BE(newParams.TIMER_REJECT || 0, 20); // Offset 20 (DINT)

      buf.writeFloatBE(newParams.SENSOR_TO_ALARM1_DISTANCE || 0, 24); // Offset 24
      buf.writeFloatBE(newParams.SENSOR_TO_ALARM2_DISTANCE || 0, 28); // Offset 28
      buf.writeFloatBE(newParams.STEP || 0, 32); // Offset 32

      // 3. Ép kiểu Buffer thành mảng Byte thuần (Array) để thư viện nodes7 dễ tiêu hóa nhất
      const byteArray = Array.from(buf);

      // 4. Ghi 1 cú duy nhất thẳng vào "PARAMETERS_BLOCK" (DB19,B0.32)
      conn.writeItems("PARAMETERS_BLOCK", byteArray, (err) => {
        if (err) {
          console.error("❌ Lỗi ghi Parameters xuống PLC:", err);
        } else {
          console.log("✅ Đã nạp thành công Recipe nguyên khối xuống DB19!");
        }
      });
    } catch (error) {
      console.error("❌ Lỗi trong quá trình đóng gói Buffer:", error);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Production Server đang chạy tại port ${PORT}`);
});
