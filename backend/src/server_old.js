const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const nodes7 = require("nodes7");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const conn = new nodes7();

console.log("✅ Đang khởi động kết nối tới PLC S7-1200 THẬT...");

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

  // Cờ M của em (Anh đang giả sử em dùng M10.0, em HÃY SỬA LẠI cho đúng với TIA Portal nhé)
  FLAG_M: "M50.1",
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
  conn.addItems(["TRACKING_BLOCK", "FLAG_M", "RESET_CMD_WEB"]);

  // Quét PLC mỗi 100ms
  setInterval(() => {
    conn.readAllItems((err, values) => {
      if (err) {
        console.error("Lỗi đọc dữ liệu PLC:", err);
        return;
      }

      const rawBuffer = values.TRACKING_BLOCK;

      if (rawBuffer && rawBuffer.length >= 119) {
        // Tách 118 byte đầu tiên làm băng tải
        const trackingArray = parseS7BufferToBits(rawBuffer.slice(0, 118), 944);

        // Móc Alarm 1 và 2 từ byte thứ 118 (Index 118)
        const alarm1 = (rawBuffer[118] & (1 << 0)) !== 0; // Tương đương DB7.DBX118.0
        const alarm2 = (rawBuffer[118] & (1 << 1)) !== 0; // Tương đương DB7.DBX118.1

        // Lấy cờ M
        const flagM = values.FLAG_M;

        // Phát sóng sang React
        io.emit("plc_data", {
          trackingData: trackingArray,
          alarm1: alarm1,
          alarm2: alarm2,
          flagM: flagM,
        });
      }
    });
  }, 100);
});

// 5. NHẬN LỆNH ĐIỀU KHIỂN TỪ WEB (NÚT RESET)
io.on("connection", (socket) => {
  console.log(`💻 Web Client connected: ${socket.id}`);

  socket.on("write_plc", (payload) => {
    if (payload.tag === "RESET_CMD") {
      console.log(`Nhận lệnh Web: Ghi [${payload.value}] xuống DB25.DBX118.2`);

      // FIX LỖI Ở ĐÂY: Truyền chuỗi Tag Name "RESET_CMD_WEB" thay vì truyền thẳng địa chỉ
      conn.writeItems("RESET_CMD_WEB", payload.value, (err) => {
        if (err) console.error("❌ Lỗi ghi PLC:", err);
      });
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Production Server đang chạy tại port ${PORT}`);
});
