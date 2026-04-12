const RecipeManager = ({
  newRecipeName,
  selectedRecipe,
  setNewRecipeName,
  handleSaveRecipe,
  savedRecipes,
  handleLoadRecipe,
  handleDeleteRecipe,
}) => {
  return (
    <div className="col-span-1 flex flex-col p-6 rounded-2xl bg-[#0a0d14] border border-slate-800/80 shadow-2xl relative">
      <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-widest mb-6">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          ></path>
        </svg>
        Database
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#050505] border border-slate-800/60 shadow-inner">
          <input
            type="text"
            placeholder="Tên Line (VD: Line Sữa Chua)"
            value={newRecipeName}
            onChange={(e) => setNewRecipeName(e.target.value)}
            className="bg-transparent text-sm text-white font-mono outline-none border-b border-slate-700 pb-2 focus:border-cyan-500 transition-colors placeholder:text-slate-600"
          />
          <button
            onClick={handleSaveRecipe}
            className="bg-cyan-600/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
          >
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
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              ></path>
            </svg>
            LƯU VÀO MÁY CHỦ
          </button>
        </div>

        <div className="flex flex-col mt-4">
          <label className="text-[12px] text-slate-500 font-mono tracking-widest uppercase mb-3">
            Profiles Trên Server:
          </label>
          <div className="flex flex-col gap-2 max-h-55 overflow-y-auto pr-2 custom-scrollbar">
            {Object.keys(savedRecipes).length === 0 ? (
              <span className="text-sm text-slate-600 italic">
                Server chưa có dữ liệu
              </span>
            ) : (
              Object.keys(savedRecipes).map((name) => (
                <div
                  key={name}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border group/item ${selectedRecipe === name ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "bg-[#050505] border-slate-800/60 hover:border-slate-600"}`}
                >
                  <span
                    onClick={() => handleLoadRecipe(name)}
                    className={`text-sm font-mono truncate flex-1 ${selectedRecipe === name ? "text-cyan-400 font-bold" : "text-slate-300 group-hover/item:text-white"}`}
                  >
                    {name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRecipe(name);
                    }}
                    className="text-slate-600 hover:text-red-500 transition-colors px-2"
                  >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeManager;
