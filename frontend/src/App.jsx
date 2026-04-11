import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Header from "../components/Header";
import AlarmPanels from "../components/AlarmPanels";
import Conveyor from "../components/Conveyor";

// Tự động bắt đúng đường dẫn:
// - Nếu đang chạy "npm run dev" (Vite): Trỏ về Backend 3001
// - Nếu đã đóng gói file .exe: Trỏ về chính nó ("/")
const socketUrl = import.meta.env.DEV ? "http://localhost:3001" : "/";
const socket = io(socketUrl);

// --- TỪ ĐIỂN ĐƠN VỊ CHO CÁC THÔNG SỐ ---
const PARAM_UNITS = {
  PRODUCT_LENGTH: "mm",
  DIAMETER_SENSOR: "mm",
  DIAMETER_PRODUCT: "mm",
  DIAMETER: "mm",
  FILTER_TRIGGER: "mm",
  TIMER_REJECT: "ms",
  SENSOR_TO_ALARM1_DISTANCE: "mm",
  SENSOR_TO_ALARM2_DISTANCE: "mm",
  ALARM1_TO_ALARM2_DISTANCE: "mm",
  STEP: "mm",
  ENCODER_PULSE: "pulse",
};

function App() {
  const [plcData, setPlcData] = useState({
    trackingData: [],
    alarm1: false,
    alarm2: false,
    flagM: false,
    parameters: null,
  });

  const [editParams, setEditParams] = useState({});

  // STATE QUẢN LÝ RECIPE TỪ SERVER
  const [savedRecipes, setSavedRecipes] = useState({});
  const [newRecipeName, setNewRecipeName] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState("");

  useEffect(() => {
    socket.on("plc_data", (data) => {
      setPlcData(data);
      setEditParams((prev) =>
        Object.keys(prev).length === 0 ? data.parameters : prev,
      );
    });

    socket.on("update_recipes", (recipesFromServer) => {
      setSavedRecipes(recipesFromServer);
    });

    return () => {
      socket.off("plc_data");
      socket.off("update_recipes");
    };
  }, []);

  // --- CÁC HÀM XỬ LÝ RECIPE (Gọi API qua Socket) ---
  const handleSaveRecipe = () => {
    if (!newRecipeName.trim()) {
      alert("⚠️ Vui lòng nhập tên Line/Máy để lưu!");
      return;
    }
    socket.emit("save_recipe", { name: newRecipeName, parameters: editParams });
    setNewRecipeName("");
    setSelectedRecipe(newRecipeName);
  };

  const handleLoadRecipe = (name) => {
    if (savedRecipes[name]) {
      setEditParams(savedRecipes[name]);
      setSelectedRecipe(name);
    }
  };

  const handleDeleteRecipe = (name) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn xóa thông số của [${name}] không?`)
    ) {
      socket.emit("delete_recipe", name);
      if (selectedRecipe === name) setSelectedRecipe("");
    }
  };

  // --- CÁC NÚT ĐIỀU KHIỂN ---
  const handleParamChange = (key, value) => {
    setEditParams((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSyncToPLC = () => {
    socket.emit("write_parameters", editParams);
    alert("✅ Đã đồng bộ thông số xuống PLC thành công!");
  };

  // 3 Lệnh độc lập
  const triggerPLCCommand = (cmd) => {
    socket.emit("write_plc_command", cmd);
  };

  const isAnyAlarmActive = plcData.alarm1 || plcData.alarm2;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans pb-20 relative overflow-hidden selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-125 bg-cyan-900/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* HEADER */}
        <Header isAnyAlarmActive={isAnyAlarmActive} />

        {/* ALARM PANELS */}
        <AlarmPanels plcData={plcData} />

        {/* REAL-TIME CONVEYOR VISUALIZATION */}
        <Conveyor plcData={plcData} />

        {/* MAIN LAYOUT: EDGE DB & PARAMETERS (LEFT) + MASTER CONTROL (RIGHT) */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 flex flex-col lg:flex-row gap-6">
            {/* CỘT TRÁI: RECIPE MANAGER */}
            <div className="lg:w-1/3 flex flex-col p-6 rounded-2xl bg-[#0a0d14] border border-slate-800/80 shadow-2xl relative">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-widest mb-6">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  ></path>
                </svg>
                Edge Database
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#050505] border border-slate-800/60 shadow-inner">
                  <input
                    type="text"
                    placeholder="Tên Line (VD: Line Sữa Chua)"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    className="bg-transparent text-sm text-white font-mono outline-none border-b border-slate-700 pb-2 focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    onClick={handleSaveRecipe}
                    className="bg-cyan-600/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
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
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      ></path>
                    </svg>
                    LƯU VÀO MÁY CHỦ
                  </button>
                </div>

                <div className="flex flex-col mt-4">
                  <label className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-3">
                    Profiles Trên Server:
                  </label>
                  <div className="flex flex-col gap-2 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.keys(savedRecipes).length === 0 ? (
                      <span className="text-sm text-slate-600 italic">
                        Server chưa có dữ liệu
                      </span>
                    ) : (
                      Object.keys(savedRecipes).map((name) => (
                        <div
                          key={name}
                          className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border group/item ${selectedRecipe === name ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "bg-[#050505] border-slate-800/60 hover:border-slate-600"}`}
                        >
                          <span
                            onClick={() => handleLoadRecipe(name)}
                            className={`text-sm font-mono truncate flex-1 ${selectedRecipe === name ? "text-cyan-400 font-bold" : "text-slate-300 group-hover/item:text-white"}`}
                          >
                            {name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecipe(name);
                            }}
                            className="text-slate-600 hover:text-red-500 transition-colors px-2"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: MACHINE PARAMETERS */}
            <div className="lg:w-2/3 p-6 rounded-2xl bg-[#0a0d14] border border-slate-800/80 shadow-2xl relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
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
                    </svg>
                  </div>
                  Parameters
                  {selectedRecipe && (
                    <span className="text-cyan-400 font-mono text-sm tracking-normal ml-2">
                      [{selectedRecipe}]
                    </span>
                  )}
                </h2>

                <button
                  onClick={handleSyncToPLC}
                  className="group/btn relative px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-sm tracking-widest font-bold rounded overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"
                >
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

              {/* TỐI ƯU HÓA LABEL: Chia lưới 3 cột, thay thế dấu _, cho phép chữ rớt 2 dòng thẳng hàng */}
              <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {editParams &&
                  Object.keys(editParams).map((key) => {
                    const unit = PARAM_UNITS[key.toUpperCase()] || "";
                    return (
                      <div
                        key={key}
                        className="flex flex-col bg-[#050505] p-3 sm:p-4 rounded-lg border border-slate-800/60 hover:border-blue-500/50 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)] group/input"
                      >
                        <label
                          className="text-[10px] sm:text-[12px] uppercase text-slate-400 font-mono mb-2 leading-relaxed wrap-break-word group-focus-within/input:text-blue-400 transition-colors tracking-wider min-h-8 flex items-center"
                          title={key}
                        >
                          {key.replace(/_/g, " ")}
                        </label>
                        <div className="flex items-baseline border-b border-transparent group-focus-within/input:border-blue-500 transition-colors">
                          <input
                            type="number"
                            step="any"
                            value={editParams[key]}
                            onChange={(e) =>
                              handleParamChange(key, e.target.value)
                            }
                            className="bg-transparent text-xl sm:text-2xl text-slate-200 font-mono font-bold outline-none w-full transition-colors group-focus-within/input:text-white pb-1"
                          />
                          {unit && (
                            <span className="text-xs font-mono font-bold text-cyan-700 ml-2 mb-1 uppercase tracking-widest select-none">
                              {unit}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* MASTER CONTROL PANEL (3 CHỨC NĂNG NẰM BÊN PHẢI) */}
          <div className="xl:col-span-1 flex flex-col gap-4 justify-start">
            <button
              onClick={() => triggerPLCCommand("WEB_CMD_RESET_ALARM")}
              disabled={!isAnyAlarmActive}
              className={`relative h-20 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 group border-b-4 ${isAnyAlarmActive ? "bg-linear-to-r from-blue-600 to-cyan-600 border-blue-900 shadow-[0_5px_15px_rgba(6,182,212,0.4)]" : "bg-gradient-to-r from-slate-700 to-slate-800 border-slate-900 hover:bg-slate-600"}`}
            >
              <svg
                className={`w-6 h-6 ${isAnyAlarmActive ? "text-white" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div className="flex flex-col items-start">
                <span
                  className={`font-black tracking-widest ${isAnyAlarmActive ? "text-white" : "text-slate-300"}`}
                >
                  RESET ALARM
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    "BẬT CHẾ ĐỘ BYPASS? \nHệ thống sẽ bỏ qua mọi sản phẩm lỗi!",
                  )
                ) {
                  triggerPLCCommand("WEB_CMD_BYPASS");
                }
              }}
              className="relative h-20 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 bg-linear-to-r from-amber-700 to-orange-600 border-b-4 border-amber-950 hover:brightness-110 shadow-[0_5px_15px_rgba(245,158,11,0.2)]"
            >
              <svg
                className="w-6 h-6 text-white"
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
              <div className="flex flex-col items-start">
                <span className="font-black tracking-widest text-white">
                  BYPASS MODE
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    "CẢNH BÁO: KHỞI ĐỘNG LẠI CHƯƠNG TRÌNH? \nMọi thông số đếm sẽ bị xóa!",
                  )
                ) {
                  triggerPLCCommand("WEB_CMD_RESET_PROG");
                }
              }}
              className="relative h-[80px] rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 bg-linear-to-r from-red-800 to-red-950 border-b-4 border-black hover:brightness-110 shadow-[0_5px_15px_rgba(220,38,38,0.2)]"
            >
              <svg
                className="w-6 h-6 text-red-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              <div className="flex flex-col items-start">
                <span className="font-black tracking-widest text-red-100">
                  RESET SYSTEM
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `,
        }}
      />
    </div>
  );
}

export default App;
