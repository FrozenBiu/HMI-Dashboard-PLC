import React from "react";

const Conveyor = ({ plcData }) => {
  const params = plcData?.parameters || {};
  const TOTAL_BITS = 944;

  const step = params.STEP > 0 ? params.STEP : 1;
  const distAlarm1 = params.SENSOR_TO_ALARM1_DISTANCE || 0;
  const distAlarm2 = params.SENSOR_TO_ALARM2_DISTANCE || 0;

  const alarm1Percent = Math.min(
    Math.max((distAlarm1 / step / TOTAL_BITS) * 100, 0),
    100,
  );
  const alarm2Percent = Math.min(
    Math.max((distAlarm2 / step / TOTAL_BITS) * 100, 0),
    100,
  );

  const rawLineSpeed = plcData.lineSpeed || 0;
  const displayLineSpeed =
    !isNaN(rawLineSpeed) && rawLineSpeed !== null
      ? Number(rawLineSpeed).toFixed(1)
      : "0.0";

  // TÍNH TOÁN TỐC ĐỘ ANIMATION DỰA TRÊN TỐC ĐỘ THỰC TẾ
  // Giả sử tốc độ chuẩn là 50m/min thì animation chạy mất 1s.
  // Nếu tốc độ càng cao, thời gian animation càng ngắn -> sọc chạy càng nhanh.
  const animationDuration = rawLineSpeed > 0 ? 50 / rawLineSpeed : 0;

  return (
    <div className="mb-10 p-8 rounded-2xl bg-[#0a0d14] border border-slate-800/80 relative shadow-2xl overflow-hidden group">
      {/* KHAI BÁO CSS KEYFRAMES CHO BĂNG TẢI TRƯỢT */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes rollingBelt {
          from { background-position: 0 0; }
          to { background-position: -28px 0; } /* Trượt sang trái (âm) để cảm giác sản phẩm trôi từ trái qua phải */
        }
        .belt-pattern {
          background-image: repeating-linear-gradient(
            -45deg,
            rgba(6, 182, 212, 0.05),
            rgba(6, 182, 212, 0.05) 10px,
            transparent 10px,
            transparent 20px
          );
          background-size: 28px 28px;
        }
      `,
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>

      <div className="flex justify-between items-center mb-10 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wide">
          <div className="p-2 bg-cyan-500/10 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <svg
              className={`w-5 h-5 text-cyan-400 ${rawLineSpeed > 0 ? "animate-spin" : ""}`}
              style={{ animationDuration: "3s" }}
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
          </div>
          Live Tracking View
        </h2>

        {/* WIDGET TỐC ĐỘ DÂY CHUYỀN */}
        <div className="flex items-center gap-4 bg-[#050505] px-5 py-2.5 rounded-xl border border-slate-800/60 shadow-inner">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border transition-colors ${rawLineSpeed > 0 ? "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-slate-900 border-slate-700"}`}
            >
              <svg
                className={`w-5 h-5 ${rawLineSpeed > 0 ? "text-cyan-400" : "text-slate-500"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-0.5">
                Line Speed
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-black font-mono leading-none ${rawLineSpeed > 0 ? "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" : "text-slate-500"}`}
                >
                  {displayLineSpeed}
                </span>
                <span
                  className={`text-xs font-mono font-bold uppercase ${rawLineSpeed > 0 ? "text-cyan-600" : "text-slate-600"}`}
                >
                  m/min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-32 bg-[#050505] rounded-xl overflow-visible border border-slate-800 px-8 flex items-center shadow-inner z-10">
        <div className="relative w-full h-full">
          {/* NỀN BĂNG TẢI CHẠY (ÁP DỤNG TRICK ANIMATION Ở ĐÂY) */}
          <div
            className="absolute left-0 right-0 h-4 top-1/2 transform -translate-y-1/2 belt-pattern rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_0_10px_rgba(0,0,0,0.5)] border border-slate-800/80"
            style={{
              animation:
                rawLineSpeed > 0
                  ? `rollingBelt ${animationDuration}s linear infinite`
                  : "none",
            }}
          ></div>

          {/* CÁC MỐC ĐÁNH DẤU */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div
              className="absolute top-0 h-full flex flex-col items-center -translate-x-1/2"
              style={{ left: "0%" }}
            >
              <div className="absolute -top-8 text-[12px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap z-20">
                SENSOR
              </div>
              <div className="h-full w-px bg-gradient-to-b from-cyan-500 to-transparent"></div>
            </div>

            <div
              className="absolute top-0 h-full flex flex-col items-center transition-all duration-700 ease-out -translate-x-1/2"
              style={{ left: `${alarm1Percent}%` }}
            >
              <div className="absolute -top-8 text-[12px] font-mono text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 whitespace-nowrap z-20">
                ALARM 1
              </div>
              <div className="h-full w-px bg-gradient-to-b from-red-500/80 via-red-500/20 to-transparent border-r border-dashed border-red-500/50"></div>
            </div>

            <div
              className="absolute top-0 h-full flex flex-col items-center transition-all duration-700 ease-out -translate-x-1/2"
              style={{ left: `${alarm2Percent}%` }}
            >
              <div className="absolute -top-8 text-[12px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap z-20">
                ALARM 2
              </div>
              <div className="h-full w-px bg-gradient-to-b from-amber-500/80 via-amber-500/20 to-transparent border-r border-dashed border-amber-500/50"></div>
            </div>
          </div>

          {/* Render Mảng Vạch Đỏ Lỗi (Thêm hiệu ứng Motion Blur) */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {plcData.trackingData &&
              plcData.trackingData.map((isError, index) => {
                if (!isError) return null;
                const positionPercent = (index / TOTAL_BITS) * 100;
                return (
                  <div
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-14 bg-red-500 rounded-[2px] z-20 shadow-[0_0_15px_rgba(239,68,68,1),-5px_0_10px_rgba(239,68,68,0.3)]"
                    style={{ left: `${positionPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/40 w-full h-full mix-blend-overlay"></div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conveyor;
