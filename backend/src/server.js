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

console.log("✅ Đang khởi động kết nối tới PLC S7-1200 THẬT...");

// --- MỚI: DATABASE CỤC BỘ BẰNG FILE JSON ---
const DB_FILE = path.join(__dirname, "recipes.json");
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

// 1. CẤU HÌNH IP PLC THẬT
const PLC_CONFIG = {
  port: 102,
  host: "192.168.0.10", // Đổi lại IP nếu con PLC thật của em khác dải này
  rack: 0,
  slot: 1,
};

// 2. BẢN ĐỒ VÙNG NHỚ
const VARIABLES = {
  // Đọc 119 bytes (118 bytes mảng vị trí + 1 byte chứa Alarm1, Alarm2)
  TRACKING_BLOCK: "DB25,B0.119",
  RESET_CMD_WEB: "M202.1",
  FLAG_M: "M50.1", // cờ tín hiệu cho biết alarm1 đã được reset chưa để kích alarm2

  // --- THÊM MAP CHO BẢNG SETTINGS (Giả sử DB Data của em là DB10) ---
  // Kiểu Real dùng 'R', kiểu DInt dùng 'D'
  // --- GIẢI PHÁP: Gom toàn bộ DB10 thành 1 cục 32 Bytes để đọc ---
  PARAMETERS_BLOCK: "DB10,B0.32",

  PRODUCT_LENGTH: "DB10,R0",
  DIAMETER_SENSOR: "DB10,R4",
  ENCODER_PULSE: "DB10,R8",
  DIAMETER: "DB10,R12",
  FILTER_TRIGGER: "DB10,R16",
  TIMER_REJECT: "DB10,D20",
  ALARM1_TO_ALARM2_DISTANCE: "DB10,R24",
  SENSOR_TO_ALARM1_DISTANCE: "DB10,R28",
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

  const parameterTags = [
    "PRODUCT_LENGTH",
    "DIAMETER_SENSOR",
    "ENCODER_PULSE",
    "DIAMETER",
    "FILTER_TRIGGER",
    "TIMER_REJECT",
    "ALARM1_TO_ALARM2_DISTANCE",
    "SENSOR_TO_ALARM1_DISTANCE",
  ];

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
      const paramBuffer = values.PARAMETERS_BLOCK; // Lấy cục Buffer 32 bytes của DB10

      if (
        rawBuffer &&
        rawBuffer.length >= 119 &&
        paramBuffer &&
        paramBuffer.length >= 32
      ) {
        // 1. Bóc mảng Tracking (Giữ nguyên)
        const trackingArray = parseS7BufferToBits(rawBuffer.slice(0, 118), 944);
        const alarm1 = (rawBuffer[118] & (1 << 0)) !== 0;
        const alarm2 = (rawBuffer[118] & (1 << 1)) !== 0;

        // 2. FIX LỖI Ở ĐÂY: Ép kiểu mảng thuần thành Node.js Buffer
        const safeParamBuffer = Buffer.from(paramBuffer);

        // 3. Bây giờ safeParamBuffer đã là Buffer xịn, gọi readFloatBE thoải mái!
        const parsedParams = {
          PRODUCT_LENGTH: safeParamBuffer.readFloatBE(0),
          DIAMETER_SENSOR: safeParamBuffer.readFloatBE(4),
          ENCODER_PULSE: safeParamBuffer.readFloatBE(8),
          DIAMETER: safeParamBuffer.readFloatBE(12),
          FILTER_TRIGGER: safeParamBuffer.readFloatBE(16),
          TIMER_REJECT: safeParamBuffer.readInt32BE(20), // DInt là Int32
          ALARM1_TO_ALARM2_DISTANCE: safeParamBuffer.readFloatBE(24),
          SENSOR_TO_ALARM1_DISTANCE: safeParamBuffer.readFloatBE(28),
        };

        // 4. Phát sóng lên React
        io.emit("plc_data", {
          trackingData: trackingArray,
          alarm1: alarm1,
          alarm2: alarm2,
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

  // NHẬN LỆNH RESET_CMD TỪ WEB
  socket.on("write_plc", (payload) => {
    if (payload.tag === "RESET_CMD") {
      console.log(`Nhận lệnh Web: Ghi [${payload.value}] xuống DB25.DBX118.2`);

      // FIX LỖI Ở ĐÂY: Truyền chuỗi Tag Name "RESET_CMD_WEB" thay vì truyền thẳng địa chỉ
      conn.writeItems("RESET_CMD_WEB", payload.value, (err) => {
        if (err) console.error("❌ Lỗi ghi PLC:", err);
      });
    }
  });

  // NHẬN LỆNH LƯU SETTINGS TỪ WEB
  socket.on("write_parameters", (newParams) => {
    console.log("📥 Nhận thông số mới từ Web:", newParams);

    // Tách object thành mảng Tags và mảng Values để ghi 1 lần xuống PLC
    const tags = Object.keys(newParams);
    const values = Object.values(newParams);

    conn.writeItems(tags, values, (err) => {
      if (err) {
        console.error("❌ Lỗi ghi Parameters xuống PLC:", err);
      } else {
        console.log("✅ Đã nạp thành công Recipe mới xuống PLC!");
      }
    });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Production Server đang chạy tại port ${PORT}`);
});
