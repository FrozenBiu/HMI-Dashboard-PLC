const dbService = require("../services/dbService");
const plcService = require("../services/plcService");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`💻 Web Client connected: ${socket.id}`);

    // Gửi data gốc ngay khi user vừa load trang Web
    socket.emit("update_logs", dbService.getLogs());
    socket.emit("update_recipes", dbService.getRecipes());

    // 1. Lưu Recipe
    socket.on("save_recipe", (payload) => {
      const savedRecipesDB = dbService.getRecipes();
      savedRecipesDB[payload.name] = payload.parameters;
      dbService.saveRecipes(savedRecipesDB);

      io.emit("update_recipes", savedRecipesDB);
      console.log(`💾 Đã lưu Recipe [${payload.name}] vào Database cục bộ.`);
    });

    // 2. Xóa Recipe
    socket.on("delete_recipe", (name) => {
      const savedRecipesDB = dbService.getRecipes();
      delete savedRecipesDB[name];
      dbService.saveRecipes(savedRecipesDB);

      io.emit("update_recipes", savedRecipesDB);
      console.log(`🗑️ Đã xóa Recipe [${name}] khỏi Database.`);
    });

    // 3. Điều khiển 3 Nút độc lập
    socket.on("write_plc_command", (commandTag) => {
      plcService.writeCommand(commandTag);
    });

    // 4. Đồng bộ DB19
    socket.on("write_parameters", (newParams) => {
      plcService.writeParams(newParams);
    });
  });
};
