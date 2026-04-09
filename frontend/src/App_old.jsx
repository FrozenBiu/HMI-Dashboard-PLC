import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Kết nối tới trạm trung chuyển Node.js (Nhớ đổi IP nếu deploy sang máy khác)
const socket = io("http://localhost:3001");

function App() {
  // Khởi tạo state chờ dữ liệu từ PLC thật
  const [plcData, setPlcData] = useState({
    trackingData: new Array(944).fill(false),
    alarm1: false,
    alarm2: false,
    flagM: false, // Cờ xác nhận (M50.1)
  });

  useEffect(() => {
    // Lắng nghe luồng data stream từ máy thật
    socket.on("plc_data", (data) => setPlcData(data));
    return () => socket.off("plc_data");
  }, []);

  // Gửi lệnh Reset xuống Node.js (Node.js sẽ ghi vào DB25.DBX118.2)
  const handleReset = () => {
    socket.emit("write_plc", { tag: "RESET_CMD", value: true });
  };
  const releaseReset = () => {
    socket.emit("write_plc", { tag: "RESET_CMD", value: false });
  };

  const isAnyAlarmActive = plcData.alarm1 || plcData.alarm2;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wider">
              PRODUCTION <span className="text-blue-500">HMI</span> DASHBOARD
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Multi-stage Defect Rejection System (S7-1200 Connected)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${isAnyAlarmActive ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
            ></div>
            <span className="font-mono font-bold">
              {isAnyAlarmActive ? "SYSTEM FAULT" : "SYSTEM ONLINE"}
            </span>
          </div>
        </div>

        {/* ALARM PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Station 1 */}
          <div
            className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300
            ${plcData.alarm1 ? "bg-red-900/30 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-slate-800 border-slate-700"}`}
          >
            <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-2">
              STATION 1 (1.6m)
            </h2>
            <div
              className={`text-2xl font-bold ${plcData.alarm1 ? "text-red-500 animate-pulse" : "text-slate-500"}`}
            >
              {plcData.alarm1 ? "⚠️ ALARM 1 TRIGGERED" : "CLEAR"}
            </div>
          </div>

          {/* Station 2 */}
          <div
            className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300
            ${plcData.alarm2 ? "bg-orange-900/30 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-slate-800 border-slate-700"}`}
          >
            <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-2">
              STATION 2 (+20m)
            </h2>
            <div
              className={`text-2xl font-bold ${plcData.alarm2 ? "text-orange-500 animate-pulse" : "text-slate-500"}`}
            >
              {plcData.alarm2 ? "⚠️ ALARM 2 TRIGGERED" : "CLEAR"}
            </div>
          </div>

          {/* Acknowledge Flag (M) */}
          <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center transition-all">
            <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-2">
              Acknowledge Flag (M50.1)
            </h2>
            <div
              className={`text-5xl font-mono font-bold ${plcData.flagM ? "text-blue-400" : "text-slate-600"}`}
            >
              {plcData.flagM ? "1" : "0"}
            </div>
          </div>
        </div>

        {/* CONTROL PANEL */}
        <div className="mb-8 flex justify-center">
          <button
            onMouseDown={handleReset}
            onMouseUp={releaseReset}
            // onMouseLeave={releaseReset}
            className={`px-24 py-4 rounded-lg font-bold text-xl text-white transition-all transform active:scale-95 shadow-lg
              ${
                isAnyAlarmActive
                  ? "bg-red-600 hover:bg-red-500 hover:shadow-red-500/50"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
          >
            MASTER RESET (DB25.DBX118.2)
          </button>
        </div>

        {/* REAL-TIME CONVEYOR VISUALIZATION */}
        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 relative">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            Live Production Tracking (944 bits from S7-1200)
          </h2>

          <div className="relative w-full h-24 bg-slate-900 rounded-lg overflow-hidden border-y-4 border-slate-600 px-2 mt-8">
            {/* Markers */}
            <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 z-20"></div>
            <div className="absolute left-2 -top-6 text-xs font-mono text-blue-400">
              SENSOR (I0.x)
            </div>

            <div className="absolute left-[7.4%] top-0 h-full w-1 bg-red-500/50 border-r border-dashed border-red-500 z-20"></div>
            <div className="absolute left-[7.4%] -top-6 text-xs font-mono text-red-400 -translate-x-1/2">
              ALARM 1
            </div>

            <div className="absolute left-[99.5%] top-0 h-full w-1 bg-orange-500/50 border-r border-dashed border-orange-500 z-20"></div>
            <div className="absolute right-0 -top-6 text-xs font-mono text-orange-400">
              ALARM 2
            </div>

            <div className="absolute left-0 right-0 h-1 bg-slate-700 top-1/2 transform -translate-y-1/2"></div>

            {/* Tracking Array Render */}
            <div className="flex w-full h-full items-center justify-start gap-[1px]">
              {plcData.trackingData.map((isError, index) => {
                if (isError) {
                  return (
                    <div
                      key={index}
                      className="w-3 h-12 bg-red-500 rounded-sm z-10 shadow-[0_0_10px_red]"
                    ></div>
                  );
                }
                return (
                  <div
                    key={index}
                    className="flex-1 max-w-[2px] h-4 bg-slate-700 opacity-20"
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
