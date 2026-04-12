import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Header from "./components/Header";
import AlarmPanels from "./components/AlarmPanels";
import Conveyor from "./components/Conveyor";
import RecipeManager from "./components/RecipeManager";
import Parameters from "./components/Parameters";
import SystemLogs from "./components/SystemLogs";
import ControlPanel from "./components/ControlPanel";

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
          <ControlPanel
            isAnyAlarmActive={isAnyAlarmActive}
            triggerPLCCommand={triggerPLCCommand}
          />
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
