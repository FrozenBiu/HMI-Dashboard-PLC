const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

console.log("✅ Đang khởi động kết nối tới MOCK API (Giả lập PLC)...");

// MOCK DATA STATE
let mockPlcState = {
  trackingData: new Array(944).fill(false),
  alarm1: false,
  alarm2: false,
  flagM: false,
  parameters: {
    PRODUCT_LENGTH: 120.5,
    DIAMETER_SENSOR: 50.0,
    ENCODER_PULSE: 1000.0,
    DIAMETER: 55.2,
    FILTER_TRIGGER: 10.0,
    TIMER_REJECT: 500,
    ALARM1_TO_ALARM2_DISTANCE: 20.0,
    SENSOR_TO_ALARM1_DISTANCE: 1.6,
  },
  resetCmd: false,
};

// Hàm giả lập dữ liệu chạy trên băng chuyền
function simulateConveyor() {
  // Dịch bit sang phải (băng chuyền chạy)
  mockPlcState.trackingData.unshift(false);
  mockPlcState.trackingData.pop();

  // Ngẫu nhiên cho vào 1 sản phẩm lỗi (xác suất thấp)
  if (Math.random() < 0.05) {
    mockPlcState.trackingData[0] = true;
  }

  // Giả lập logic báo Alarm
  // Vị trí trạm 1: khoang 7% của 944 bit (khoảng bit thứ 66)
  const alarm1Pos = Math.floor(944 * 0.067);
  // Vị trí trạm 2: khoang 99% của 944 bit (khoảng bit thứ 939)
  const alarm2Pos = Math.floor(944 * 0.995);

  if (mockPlcState.trackingData[alarm1Pos]) {
    mockPlcState.alarm1 = true;
  }
  if (mockPlcState.trackingData[alarm2Pos]) {
    mockPlcState.alarm2 = true;
  }
}

// 4. THIẾT LẬP KẾT NỐI VÀ ĐỌC DỮ LIỆU LIÊN TỤC
console.log("✅ ĐÃ KHỞI ĐỘNG MOCK API THÀNH CÔNG! Đang stream dữ liệu...");

// Quét PLC mỗi 100ms
setInterval(() => {
  simulateConveyor();

  // Phát sóng lên React
  io.emit("plc_data", {
    trackingData: mockPlcState.trackingData,
    alarm1: mockPlcState.alarm1,
    alarm2: mockPlcState.alarm2,
    flagM: mockPlcState.flagM,
    parameters: mockPlcState.parameters,
  });
}, 100);

// 5. NHẬN LỆNH ĐIỀU KHIỂN TỪ WEB
io.on("connection", (socket) => {
  console.log(`💻 Web Client connected: ${socket.id}`);

  // NHẬN LỆNH RESET_CMD TỪ WEB
  socket.on("write_plc", (payload) => {
    if (payload.tag === "RESET_CMD") {
      console.log(
        `Nhận lệnh Web: Ghi [${payload.value}] xuống DB25.DBX118.2 (MOCK)`,
      );
      mockPlcState.resetCmd = payload.value;

      // Xử lý logic Reset
      if (payload.value === true) {
        mockPlcState.alarm1 = false;
        mockPlcState.alarm2 = false;
        mockPlcState.flagM = !mockPlcState.flagM; // Toggle cờ M
        // Xóa sản phẩm lỗi tại vị trí trạm (tùy thuộc vào logic mong muốn, giả sử xóa tại trạm)
        const alarm1Pos = Math.floor(944 * 0.074);
        const alarm2Pos = Math.floor(944 * 0.995);
        mockPlcState.trackingData[alarm1Pos] = false;
        mockPlcState.trackingData[alarm2Pos] = false;
      }
    }
  });

  // NHẬN LỆNH LƯU SETTINGS TỪ WEB
  socket.on("write_parameters", (newParams) => {
    console.log("📥 Nhận thông số mới từ Web (MOCK):", newParams);
    mockPlcState.parameters = { ...mockPlcState.parameters, ...newParams };
    console.log("✅ Đã nạp thành công Recipe mới (MOCK)!");
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Mock API Server đang chạy tại port ${PORT}`);
});
