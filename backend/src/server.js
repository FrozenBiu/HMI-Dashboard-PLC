const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Import Modules
const dbService = require("./services/dbService");
const plcService = require("./services/plcService");
const setupSocketHandlers = require("./socket/socketHandler");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- 1. PHỤC VỤ GIAO DIỆN WEB CHO FILE ĐÓNG GÓI (.exe) ---
const isCompiled = typeof process.pkg !== "undefined";
const distPath = isCompiled
  ? path.join(path.dirname(process.execPath), "dist")
  : path.join(__dirname, "dist");

console.log("📂 Đang tải giao diện Web từ:", distPath);
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// --- 2. KHỞI CHẠY HỆ THỐNG ---
const systemConfig = dbService.loadConfig();
const PLC_CONFIG = {
  port: systemConfig.PLC_PORT,
  host: systemConfig.PLC_IP,
  rack: systemConfig.PLC_RACK,
  slot: systemConfig.PLC_SLOT,
};

console.log(`🔌 Đang kết nối tới PLC tại địa chỉ: ${PLC_CONFIG.host}...`);

// Giao quyền cho plcService chạy vòng lặp đọc PLC
plcService.initPLC(PLC_CONFIG, io);

// Giao quyền cho socketHandler lắng nghe lệnh từ Web
setupSocketHandlers(io);

// --- 3. MỞ CỔNG CHỜ ---
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Production Server đang chạy tại port ${PORT}`);
});
