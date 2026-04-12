const ControlPanel = ({ isAnyAlarmActive, triggerPLCCommand }) => {
  return (
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
        className="relative h-20 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 bg-linear-to-r from-red-800 to-red-950 border-b-4 border-black hover:brightness-110 shadow-[0_5px_15px_rgba(220,38,38,0.2)]"
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
  );
};

export default ControlPanel;
