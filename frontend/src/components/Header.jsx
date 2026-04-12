const Header = ({ isAnyAlarmActive }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-cyan-900/50 pb-6">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-0.5 w-8 bg-cyan-500"></div>
          <span className="text-cyan-500 font-mono text-xs tracking-[0.3em]">
            HMI TERMINAL V2.5 (EDGE DB)
          </span>
        </div>
        <h1
          className="text-4xl font-black text-white tracking-tight uppercase"
          style={{ textShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
        >
          Production{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600">
            Dashboard
          </span>
        </h1>
      </div>

      <div
        className={`mt-4 md:mt-0 flex items-center gap-4 px-6 py-3 rounded-full border backdrop-blur-sm transition-all duration-500 ${isAnyAlarmActive ? "bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : "bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]"}`}
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
  );
};

export default Header;
