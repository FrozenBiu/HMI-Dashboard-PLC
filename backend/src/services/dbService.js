const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(process.cwd(), "recipes.json");
const LOG_FILE = path.join(process.cwd(), "system_logs.json");
const CONFIG_FILE = path.join(process.cwd(), "config.json");

// --- BIẾN TOÀN CỤC LƯU TRÊN RAM ---
let systemLogsDB = [];
let savedRecipesDB = {};

// 1. SYSTEM CONFIG
const loadConfig = () => {
  const defaultConfig = {
    PLC_IP: "192.168.0.10",
    PLC_PORT: 102,
    PLC_RACK: 0,
    PLC_SLOT: 1,
  };
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      console.log("📄 Đã tạo file config.json mặc định.");
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Lỗi đọc config.json, đang dùng IP mặc định:", error);
    return defaultConfig;
  }
};

// 2. RECIPES
const initRecipes = () => {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
    savedRecipesDB = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Lỗi đọc DB Recipes:", error);
  }
};

const getRecipes = () => savedRecipesDB;

const saveRecipes = (data) => {
  savedRecipesDB = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// 3. SYSTEM LOGS
const initLogs = () => {
  try {
    if (!fs.existsSync(LOG_FILE))
      fs.writeFileSync(LOG_FILE, JSON.stringify([]));
    systemLogsDB = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Lỗi đọc DB Logs:", error);
  }
};

const getLogs = () => systemLogsDB;

const writeSystemLog = (errorName, productLength = null, io) => {
  const now = new Date();
  const newLog = {
    id: Date.now(),
    date: now.toLocaleDateString("vi-VN"),
    time: now.toLocaleTimeString("vi-VN", { hour12: false }),
    errorName: errorName,
    length: productLength ? Number(productLength).toFixed(1) : "-",
  };

  systemLogsDB.unshift(newLog);
  if (systemLogsDB.length > 1000) systemLogsDB.pop();

  fs.writeFileSync(LOG_FILE, JSON.stringify(systemLogsDB, null, 2));

  // Bắn toàn bộ DB lên khi có sự kiện mới
  if (io) io.emit("update_logs", systemLogsDB);
};

// Khởi tạo DB vào RAM ngay khi module được nạp
initRecipes();
initLogs();

module.exports = {
  loadConfig,
  getRecipes,
  saveRecipes,
  getLogs,
  writeSystemLog,
};
