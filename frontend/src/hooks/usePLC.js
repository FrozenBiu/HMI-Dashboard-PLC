import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Khởi tạo Socket một lần duy nhất ở ngoài Hook để tránh bị re-connect khi Component render lại
const socketUrl = import.meta.env.DEV ? "http://localhost:3001" : "/";
const socket = io(socketUrl);

export const usePLC = () => {
  // 1. STATE QUẢN LÝ DỮ LIỆU TỪ PLC
  const [plcData, setPlcData] = useState({
    trackingData: [],
    alarm1: false,
    alarm2: false,
    flagM: false,
    parameters: null,
  });
  const [plcLogs, setPlcLogs] = useState([]);

  // 2. STATE QUẢN LÝ THÔNG SỐ VÀ CÔNG THỨC (RECIPES)
  const [editParams, setEditParams] = useState({});
  const [savedRecipes, setSavedRecipes] = useState({});

  // 3. LẮNG NGHE SỰ KIỆN TỪ SERVER (SOCKET.ON)
  useEffect(() => {
    socket.on("plc_data", (data) => {
      setPlcData(data);
      // Chỉ tự động cập nhật editParams lần đầu tiên khi nó còn rỗng
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

    // Cleanup khi component unmount
    return () => {
      socket.off("plc_data");
      socket.off("update_recipes");
      socket.off("update_logs");
    };
  }, []);

  // 4. CÁC HÀM GỬI LỆNH XUỐNG SERVER (SOCKET.EMIT)
  const saveRecipeToServer = (name, parameters) => {
    socket.emit("save_recipe", { name, parameters });
  };

  const deleteRecipeFromServer = (name) => {
    socket.emit("delete_recipe", name);
  };

  const syncParametersToPLC = (params) => {
    socket.emit("write_parameters", params);
  };

  const triggerPLCCommand = (cmd) => {
    socket.emit("write_plc_command", cmd);
  };

  const updateEditParam = (key, value) => {
    setEditParams((prev) => ({ ...prev, [key]: Number(value) }));
  };

  // Trả về tất cả "đồ nghề" để App.jsx sử dụng
  return {
    plcData,
    plcLogs,
    editParams,
    setEditParams, // Cấp quyền set trực tiếp nếu cần
    savedRecipes,
    updateEditParam,
    saveRecipeToServer,
    deleteRecipeFromServer,
    syncParametersToPLC,
    triggerPLCCommand,
  };
};
