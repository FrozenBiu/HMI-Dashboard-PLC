import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Header from "../components/Header";
import AlarmPanels from "../components/AlarmPanels";
import Conveyor from "../components/Conveyor";
import RecipeManager from "../components/RecipeManager";
import Parameters from "../components/Parameters";
import SystemLogs from "../components/SystemLogs";

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
  const [plcLogs, setPlcLogs] = useState([]); // quản lý lịch sử lỗi

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

    socket.on("update_logs", (logsData) => {
      setPlcLogs(logsData);
    });

    return () => {
      socket.off("plc_data");
      socket.off("update_recipes");
      socket.off("update_logs");
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
          <div className="xl:col-span-3 flex flex-col gap-6">
            {/* Hàng 1: RecipeManager và Parameters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-150">
              <RecipeManager
                newRecipeName={newRecipeName}
                selectedRecipe={selectedRecipe}
                setNewRecipeName={setNewRecipeName}
                handleSaveRecipe={handleSaveRecipe}
                savedRecipes={savedRecipes}
                handleLoadRecipe={handleLoadRecipe}
                handleDeleteRecipe={handleDeleteRecipe}
              />

              <Parameters
                selectedRecipe={selectedRecipe}
                handleSyncToPLC={handleSyncToPLC}
                handleParamChange={handleParamChange}
                editParams={editParams}
                PARAM_UNITS={PARAM_UNITS}
              />
            </div>

            {/* Hàng 2: SystemLogs */}
            <div className="w-full gap-6">
              <SystemLogs logs={plcLogs} />
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
