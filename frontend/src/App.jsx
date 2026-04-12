import { useState } from "react";
import { usePLC } from "./hooks/usePLC"; // Kéo bộ đồ nghề từ Custom Hook vào
import Header from "./components/Header";
import AlarmPanels from "./components/AlarmPanels";
import Conveyor from "./components/Conveyor";
import RecipeManager from "./components/RecipeManager";
import Parameters from "./components/Parameters";
import SystemLogs from "./components/SystemLogs";
import ControlPanel from "./components/ControlPanel";

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
  // 1. GỌI HOOK LẤY DATA VÀ CÁC HÀM ĐIỀU KHIỂN
  const {
    plcData,
    plcLogs,
    editParams,
    setEditParams,
    savedRecipes,
    updateEditParam,
    saveRecipeToServer,
    deleteRecipeFromServer,
    syncParametersToPLC,
    triggerPLCCommand,
  } = usePLC();

  // 2. STATE GIAO DIỆN CỦA RIÊNG APP (Pure UI State)
  const [newRecipeName, setNewRecipeName] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState("");

  // 3. LOGIC XỬ LÝ NÚT BẤM (Ghép nối UI và Hook)
  const handleSaveRecipe = () => {
    if (!newRecipeName.trim()) {
      alert("⚠️ Vui lòng nhập tên Line/Máy để lưu!");
      return;
    }
    saveRecipeToServer(newRecipeName, editParams);
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
      deleteRecipeFromServer(name);
      if (selectedRecipe === name) setSelectedRecipe("");
    }
  };

  const handleSyncToPLC = () => {
    syncParametersToPLC(editParams);
    alert("✅ Đã đồng bộ thông số xuống PLC thành công!");
  };

  // Tính toán trạng thái báo động chung
  const isAnyAlarmActive = plcData.alarm1 || plcData.alarm2;

  // 4. RENDER GIAO DIỆN
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans pb-20 relative overflow-hidden selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-125 bg-cyan-900/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <Header isAnyAlarmActive={isAnyAlarmActive} />

        <AlarmPanels plcData={plcData} />

        <Conveyor plcData={plcData} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 flex flex-col gap-6">
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
                handleParamChange={updateEditParam}
                editParams={editParams}
                PARAM_UNITS={PARAM_UNITS}
              />
            </div>

            <div className="w-full gap-6">
              <SystemLogs logs={plcLogs} />
            </div>
          </div>

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
