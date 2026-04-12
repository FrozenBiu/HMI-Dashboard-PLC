const Parameters = ({
  selectedRecipe,
  handleSyncToPLC,
  handleParamChange,
  editParams,
  PARAM_UNITS,
}) => {
  return (
    <div className="col-span-2 p-6 rounded-2xl bg-[#0a0d14] border border-slate-800/80 shadow-2xl relative">
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
                    onChange={(e) => handleParamChange(key, e.target.value)}
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
  );
};

export default Parameters;
