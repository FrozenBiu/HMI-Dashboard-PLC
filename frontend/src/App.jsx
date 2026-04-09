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
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans pb-20 relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-[500px] bg-cyan-900/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-cyan-900/50 pb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-[2px] w-8 bg-cyan-500"></div>
              <span className="text-cyan-500 font-mono text-xs tracking-[0.3em]">
                HMI TERMINAL V2.4
              </span>
            </div>
            <h1
              className="text-4xl font-black text-white tracking-tight uppercase"
              style={{ textShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
            >
              Production{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                Dashboard
              </span>
            </h1>
          </div>

          <div
            className={`mt-4 md:mt-0 flex items-center gap-4 px-6 py-3 rounded-full border backdrop-blur-sm transition-all duration-500 ${
              isAnyAlarmActive
                ? "bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                : "bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
            }`}
          >
            <div className="relative flex h-4 w-4">
              {isAnyAlarmActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 ${isAnyAlarmActive ? "bg-red-500" : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"}`}
              ></span>
            </div>
            <span
              className={`font-mono font-bold tracking-widest ${isAnyAlarmActive ? "text-red-400" : "text-cyan-400"}`}
            >
              {isAnyAlarmActive ? "SYSTEM FAULT" : "SYSTEM ONLINE"}
            </span>
          </div>
        </header>

        {/* ALARM PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Station 1 */}
          <div
            className={`relative overflow-hidden p-8 rounded-2xl border flex flex-col items-start justify-center transition-all duration-500 group
            ${
              plcData.alarm1
                ? "bg-red-950/40 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                : "bg-[#0d1117] border-slate-800 hover:border-slate-700 hover:bg-[#11161d]"
            }`}
          >
            {plcData.alarm1 && (
              <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>
            )}
            {plcData.alarm1 && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl rounded-full"></div>
            )}

            <div className="flex justify-between w-full items-center mb-4 relative z-10">
              <h2
                className={`text-xs font-mono tracking-[0.2em] uppercase ${plcData.alarm1 ? "text-red-300" : "text-slate-500"}`}
              >
                Station 1 <span className="opacity-50">(1.6m)</span>
              </h2>
              <div
                className={`w-2 h-2 rounded-full ${plcData.alarm1 ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-slate-700"}`}
              ></div>
            </div>

            <div
              className={`text-3xl font-black tracking-tight relative z-10 w-full flex items-center justify-between ${
                plcData.alarm1
                  ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  : "text-slate-600"
              }`}
            >
              <span>{plcData.alarm1 ? "CRITICAL ALARM" : "STANDBY"}</span>
              {plcData.alarm1 && (
                <svg
                  className="w-8 h-8 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              )}
            </div>
            {plcData.alarm1 && (
              <div className="mt-2 text-red-400/80 font-mono text-sm uppercase animate-pulse">
                Action Required Immediately
              </div>
            )}
          </div>

          {/* Station 2 */}
          <div
            className={`relative overflow-hidden p-8 rounded-2xl border flex flex-col items-start justify-center transition-all duration-500 group
            ${
              plcData.alarm2
                ? "bg-amber-950/40 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.4)]"
                : "bg-[#0d1117] border-slate-800 hover:border-slate-700 hover:bg-[#11161d]"
            }`}
          >
            {plcData.alarm2 && (
              <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none"></div>
            )}
            {plcData.alarm2 && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full"></div>
            )}

            <div className="flex justify-between w-full items-center mb-4 relative z-10">
              <h2
                className={`text-xs font-mono tracking-[0.2em] uppercase ${plcData.alarm2 ? "text-amber-300" : "text-slate-500"}`}
              >
                Station 2 <span className="opacity-50">(+20m)</span>
              </h2>
              <div
                className={`w-2 h-2 rounded-full ${plcData.alarm2 ? "bg-amber-500 shadow-[0_0_10px_orange]" : "bg-slate-700"}`}
              ></div>
            </div>

            <div
              className={`text-3xl font-black tracking-tight relative z-10 w-full flex items-center justify-between ${
                plcData.alarm2
                  ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                  : "text-slate-600"
              }`}
            >
              <span>{plcData.alarm2 ? "WARNING FAULT" : "STANDBY"}</span>
              {plcData.alarm2 && (
                <svg
                  className="w-8 h-8 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              )}
            </div>
            {plcData.alarm2 && (
              <div className="mt-2 text-amber-400/80 font-mono text-sm uppercase animate-pulse">
                Check Sensor Alignment
              </div>
            )}
          </div>

          {/* Acknowledge Flag (M) */}
          <div className="relative overflow-hidden p-8 rounded-2xl bg-[#0d1117] border border-slate-800 flex flex-col items-start justify-center transition-all group hover:border-slate-700 hover:bg-[#11161d]">
            <div className="flex justify-between w-full items-center mb-4">
              <h2 className="text-xs font-mono tracking-[0.2em] uppercase text-slate-500">
                Ack Flag <span className="opacity-50">(M50.1)</span>
              </h2>
              <div className="flex gap-1">
                <div
                  className={`w-1 h-3 rounded-full ${plcData.flagM ? "bg-cyan-500 shadow-[0_0_8px_#06b6d4]" : "bg-slate-800"}`}
                ></div>
                <div
                  className={`w-1 h-3 rounded-full ${plcData.flagM ? "bg-cyan-500 shadow-[0_0_8px_#06b6d4]" : "bg-slate-800"}`}
                ></div>
                <div
                  className={`w-1 h-3 rounded-full ${plcData.flagM ? "bg-cyan-500 shadow-[0_0_8px_#06b6d4]" : "bg-slate-800"}`}
                ></div>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div
                className={`text-6xl font-black font-mono leading-none ${plcData.flagM ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" : "text-slate-700"}`}
              >
                {plcData.flagM ? "1" : "0"}
              </div>
              <div
                className={`text-sm font-mono uppercase mb-1 ${plcData.flagM ? "text-cyan-600" : "text-slate-600"}`}
              >
                {plcData.flagM ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>

        {/* REAL-TIME CONVEYOR VISUALIZATION */}
        <div className="mb-10 p-8 rounded-2xl bg-[#0a0d14] border border-slate-800/80 relative shadow-2xl overflow-hidden group">
          {/* Subtle grid in background of panel */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>

          <div className="flex justify-between items-center mb-10 relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wide">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <svg
                  className="w-5 h-5 text-cyan-400"
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
              </div>
              Live Tracking View
            </h2>
            <div className="text-xs font-mono text-slate-500 border border-slate-800 px-3 py-1 rounded bg-[#050505]">
              S7-1200 / 944 BITS
            </div>
          </div>

          <div className="relative w-full h-32 bg-[#050505] rounded-xl overflow-visible border border-slate-800 px-2 flex items-center shadow-inner z-10">
            {/* Markers Container - positioned absolute relative to the panel */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {/* SENSOR */}
              <div className="absolute left-2 top-0 h-full flex flex-col items-center">
                <div className="absolute -top-12 sm:-top-8 text-[9px] sm:text-[12px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap z-20">
                  SENSOR
                </div>
                <div className="h-full w-px bg-gradient-to-b from-cyan-500 to-transparent"></div>
              </div>

              {/* ALARM 1 POS */}
              <div className="absolute left-[7.4%] top-0 h-full flex flex-col items-center">
                <div className="absolute -top-6 sm:-top-8 text-[9px] sm:text-[12px] font-mono text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 whitespace-nowrap translate-x-1 sm:translate-x-0 z-20">
                  ALARM 1
                </div>
                <div className="h-full w-px bg-gradient-to-b from-red-500/80 via-red-500/20 to-transparent border-r border-dashed border-red-500/50"></div>
              </div>

              {/* ALARM 2 POS */}
              <div className="absolute left-[99.5%] top-0 h-full flex flex-col items-center">
                <div className="absolute -top-8 -right-5 text-[9px] sm:text-[12px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap z-20">
                  ALARM 2
                </div>
                <div className="h-full w-px bg-gradient-to-b from-amber-500/80 via-amber-500/20 to-transparent border-r border-dashed border-amber-500/50"></div>
              </div>
            </div>

            {/* Conveyor Belt Background Line */}
            <div className="absolute left-0 right-0 h-1 bg-slate-800 top-1/2 transform -translate-y-1/2 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>

            {/* Tracking Array Render */}
            <div className="flex w-full h-16 items-center justify-start gap-[1px] relative z-10 px-1">
              {plcData.trackingData.map((isError, index) => {
                if (isError) {
                  return (
                    <div
                      key={index}
                      className="w-2.5 h-14 bg-red-500 rounded-[1px] z-20 shadow-[0_0_12px_rgba(239,68,68,0.9)] relative"
                    >
                      <div className="absolute inset-0 bg-white/30 w-full h-full mix-blend-overlay"></div>
                    </div>
                  );
                }
                return (
                  <div
                    key={index}
                    className="flex-1 max-w-[2px] h-3 bg-cyan-900/40 rounded-[1px] transition-all hover:bg-cyan-700/50 hover:h-6"
                  ></div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MACHINE PARAMETERS & MASTER CONTROL ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* MACHINE PARAMETERS */}
          <div className="xl:col-span-3 p-8 rounded-2xl bg-[#0a0d14] border border-slate-800/80 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-transparent pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wide">
                <div className="p-2 bg-blue-500/10 rounded-lg">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </div>
                Machine Parameters{" "}
                <span className="text-slate-600 text-md font-mono normal-case tracking-normal">
                  DB10
                </span>
              </h2>
              <button
                onClick={handleSyncToPLC}
                className="group/btn relative px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm tracking-widest font-bold rounded overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"
              >
                <div className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover/btn:w-full"></div>
                <span className="relative flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    ></path>
                  </svg>
                  SYNC TO PLC
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              {editParams &&
                Object.keys(editParams).map((key) => (
                  <div
                    key={key}
                    className="flex flex-col bg-[#050505] p-4 rounded-lg border border-slate-800/60 hover:border-blue-500/50 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)] group/input"
                  >
                    <label className="text-[14px] uppercase text-slate-500 font-mono mb-2 truncate group-focus-within/input:text-blue-400 transition-colors">
                      {key}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editParams[key]}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      className="bg-transparent text-2xl text-slate-200 font-mono font-bold outline-none w-full transition-colors group-focus-within/input:text-white"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* MASTER CONTROL */}
          <div className="xl:col-span-1 flex flex-col justify-stretch">
            <button
              onMouseDown={handleReset}
              onMouseUp={releaseReset}
              onMouseLeave={releaseReset}
              className={`relative h-full min-h-[160px] rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-150 transform active:scale-95 active:translate-y-1 overflow-hidden group border-b-4
                ${
                  isAnyAlarmActive
                    ? "bg-gradient-to-b from-red-600 to-red-800 border-red-950 shadow-[0_10px_30px_rgba(220,38,38,0.4),inset_0_2px_10px_rgba(255,255,255,0.3)] hover:brightness-110"
                    : "bg-gradient-to-b from-slate-700 to-slate-900 border-slate-950 shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_2px_5px_rgba(255,255,255,0.1)] hover:brightness-110"
                }`}
            >
              {/* Button Gloss Overlay */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl"></div>

              <svg
                className={`w-12 h-12 mb-3 ${isAnyAlarmActive ? "text-red-100" : "text-slate-400"}`}
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

              <span
                className={`text-xl font-black tracking-widest text-center ${isAnyAlarmActive ? "text-white" : "text-slate-300"}`}
                style={{
                  textShadow: isAnyAlarmActive
                    ? "0 2px 4px rgba(0,0,0,0.5)"
                    : "none",
                }}
              >
                RESET BUTTON
              </span>
              <span
                className={`text-[14px] font-mono mt-2 opacity-70 ${isAnyAlarmActive ? "text-red-200" : "text-slate-500"}`}
              >
                DB25.DBX118.2
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
