const AlarmPanels = ({ plcData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      <div
        className={`relative overflow-hidden p-8 rounded-2xl border flex flex-col items-start justify-center transition-all duration-500 group ${plcData.alarm1 ? "bg-red-950/40 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]" : "bg-[#0d1117] border-slate-800 hover:border-slate-700 hover:bg-[#11161d]"}`}
      >
        {plcData.alarm1 && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>
        )}
        <div className="flex justify-between w-full items-center mb-4 relative z-10">
          <h2
            className={`text-xs font-mono tracking-[0.2em] uppercase ${plcData.alarm1 ? "text-red-300" : "text-slate-500"}`}
          >
            Alarm 1
          </h2>
          <div
            className={`w-2 h-2 rounded-full ${plcData.alarm1 ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-slate-700"}`}
          ></div>
        </div>
        <div
          className={`text-3xl font-black tracking-tight relative z-10 w-full flex items-center justify-between ${plcData.alarm1 ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "text-slate-600"}`}
        >
          <span>{plcData.alarm1 ? "CRITICAL ALARM" : "STANDBY"}</span>
        </div>
      </div>

      <div
        className={`relative overflow-hidden p-8 rounded-2xl border flex flex-col items-start justify-center transition-all duration-500 group ${plcData.alarm2 ? "bg-amber-950/40 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.4)]" : "bg-[#0d1117] border-slate-800 hover:border-slate-700 hover:bg-[#11161d]"}`}
      >
        {plcData.alarm2 && (
          <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none"></div>
        )}
        <div className="flex justify-between w-full items-center mb-4 relative z-10">
          <h2
            className={`text-xs font-mono tracking-[0.2em] uppercase ${plcData.alarm2 ? "text-amber-300" : "text-slate-500"}`}
          >
            Alarm 2
          </h2>
          <div
            className={`w-2 h-2 rounded-full ${plcData.alarm2 ? "bg-amber-500 shadow-[0_0_10px_orange]" : "bg-slate-700"}`}
          ></div>
        </div>
        <div
          className={`text-3xl font-black tracking-tight relative z-10 w-full flex items-center justify-between ${plcData.alarm2 ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" : "text-slate-600"}`}
        >
          <span>{plcData.alarm2 ? "WARNING FAULT" : "STANDBY"}</span>
        </div>
      </div>

      <div className="relative overflow-hidden p-8 rounded-2xl bg-[#0d1117] border border-slate-800 flex flex-col items-start justify-center transition-all group hover:border-slate-700 hover:bg-[#11161d]">
        <div className="flex justify-between w-full items-center mb-4">
          <h2 className="text-xs font-mono tracking-[0.2em] uppercase text-slate-500">
            Ack Flag
          </h2>
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
  );
};

export default AlarmPanels;
