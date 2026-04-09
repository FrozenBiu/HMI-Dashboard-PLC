import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [plcData, setPlcData] = useState({
    trackingData: [],
    alarm1: false,
    alarm2: false,
    flagM: false,
    parameters: null, // State lưu thông số máy
  });

  // State cục bộ dùng cho các ô Input khi người dùng đang gõ
  const [editParams, setEditParams] = useState({});

  useEffect(() => {
    socket.on("plc_data", (data) => {
      setPlcData(data);
      // Chỉ đồng bộ dữ liệu vào form edit nếu người dùng chưa chỉnh sửa gì
      setEditParams((prev) =>
        Object.keys(prev).length === 0 ? data.parameters : prev,
      );
    });
    return () => socket.off("plc_data");
  }, []);

  const handleReset = () =>
    socket.emit("write_plc", { tag: "RESET_CMD", value: true });
  const releaseReset = () =>
    socket.emit("write_plc", { tag: "RESET_CMD", value: false });

  // Xử lý khi người dùng gõ vào ô Input
  const handleParamChange = (key, value) => {
    setEditParams((prev) => ({ ...prev, [key]: Number(value) }));
  };

  // Nút gửi thông số xuống PLC
  const handleSyncToPLC = () => {
    socket.emit("write_parameters", editParams);
    alert("Đã gửi thông số xuống máy!");
  };

  const isAnyAlarmActive = plcData.alarm1 || plcData.alarm2;

  console.log(plcData.parameters);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans pb-20">
      <div className="max-w-7xl mx-auto">
        {/* HEADER VÀ ALARM PANELS (Giữ nguyên như cũ) */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wider">
              PRODUCTION <span className="text-blue-500">HMI</span> DASHBOARD
            </h1>
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

        {/* ... (Các thẻ hiển thị Trạm 1, Trạm 2, Cờ M, Nút Reset em để nguyên code cũ) ... */}
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

        {/* --- MODULE MỚI: MACHINE PARAMETERS --- */}
        <div className="mt-8 p-6 rounded-xl bg-slate-800 border border-slate-700 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              Machine Parameters Setup (DB10)
            </h2>
            <button
              onClick={handleSyncToPLC}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow transition-colors"
            >
              SYNC TO PLC
            </button>
          </div>

          {/* Bảng nhập liệu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {editParams &&
              Object.keys(editParams).map((key) => (
                <div
                  key={key}
                  className="flex flex-col bg-slate-900 p-3 rounded border border-slate-700"
                >
                  <label className="text-xs text-slate-400 font-mono mb-1 truncate">
                    {key}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editParams[key]}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="bg-transparent text-lg text-white font-bold outline-none border-b border-slate-600 focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
          </div>
        </div>
        {/* --- KẾT THÚC MODULE MỚI --- */}
      </div>
    </div>
  );
}

export default App;
