import React, { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ==============================================================
// TUYỆT CHIÊU: Bọc toàn bộ Component vào React.memo()
// ==============================================================
const SystemLogs = React.memo(({ logs }) => {
  const [filterDate, setFilterDate] = useState(null);

  // MỚI: State quản lý việc Đóng/Mở của cái Popover chứa Lịch
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Hàm Lọc Log theo ngày
  const filteredLogs = logs.filter((log) => {
    if (!filterDate) return true;

    // 1. Tách ngày/tháng/năm từ Backend gửi lên (VD: "11/4/2026")
    const [day, month, year] = log.date.split("/");

    // 2. Ép thêm số 0 vào đằng trước nếu nó chỉ có 1 chữ số (Thành: "11/04/2026")
    const normalizedLogDate = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;

    // 3. Format ngày của Calendar chọn theo đúng chuẩn đó
    const selectedDateStr = format(filterDate, "dd/MM/yyyy");

    // 4. So sánh 2 chuỗi đã cùng chuẩn
    return normalizedLogDate === selectedDateStr;
  });

  // Hàm Xuất File Excel (CSV)
  const exportToExcel = () => {
    if (filteredLogs.length === 0) return alert("Không có dữ liệu để xuất!");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Ngày,Giờ,Tên Sự Kiện / Lỗi,Chiều Dài (mm)\n";

    filteredLogs.forEach((log) => {
      const row = `${log.date},${log.time},"${log.errorName}",${log.length}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileNameDate = filterDate
      ? format(filterDate, "dd-MM-yyyy")
      : format(new Date(), "dd-MM-yyyy");
    link.setAttribute("download", `Bao_Cao_He_Thong_${fileNameDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-[#0a0d14] border border-slate-800/80 shadow-2xl h-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-widest shrink-0">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          System Event Logs
        </h3>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          {/* ======================================================== */}
          {/* SHADCN DATE PICKER (Đã thêm Quản lý Đóng/Mở) */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal bg-[#050505] border-slate-700 hover:bg-slate-800/80 hover:text-cyan-400 transition-colors",
                    !filterDate ? "text-slate-500" : "text-cyan-400",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? (
                    format(filterDate, "dd/MM/yyyy", { locale: vi })
                  ) : (
                    <span>Chọn ngày lọc...</span>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-auto p-0 bg-[#0a0d14] border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                align="end"
              >
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={(date) => {
                    setFilterDate(date);
                    setIsCalendarOpen(false); // MỚI: Bấm chọn ngày xong là tự động gập cuốn lịch lại
                  }}
                  initialFocus={false} // Tắt cái này đi để tránh lỗi focus của Radix
                  locale={vi}
                  className="text-slate-300"
                  classNames={{
                    day_selected: "bg-cyan-600 text-white hover:bg-cyan-500",
                    day_today: "bg-slate-800 text-cyan-400",
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Nút Xóa Filter */}
            {filterDate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFilterDate(null)}
                className="h-9 w-9 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                title="Xóa bộ lọc"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-500 border border-emerald-600/50 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 shrink-0 h-10"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800/60 flex-1 flex flex-col min-h-[300px]">
        <div className="grid grid-cols-12 gap-2 p-3 bg-[#050505] border-b border-slate-800 text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">
          <div className="col-span-3">Ngày</div>
          <div className="col-span-2">Giờ</div>
          <div className="col-span-5">Tên Lỗi / Sự Kiện</div>
          <div className="col-span-2 text-right">Chiều Dài</div>
        </div>

        <div className="flex-1 max-h-146 overflow-y-auto custom-scrollbar bg-[#050505]/50">
          {!filteredLogs || filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-sm font-mono text-slate-600 italic mt-6">
              {filterDate
                ? "Không có dữ liệu trong ngày này..."
                : "Chưa có dữ liệu sự kiện..."}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-12 gap-2 p-3 border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors text-sm font-mono items-center"
              >
                <div className="col-span-3 text-slate-400">{log.date}</div>
                <div className="col-span-2 text-cyan-600">{log.time}</div>
                <div className="col-span-5 flex items-center gap-2 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      log.errorName.includes("Reject")
                        ? "bg-red-500 shadow-[0_0_5px_red]"
                        : log.errorName.includes("Warning")
                          ? "bg-amber-500 shadow-[0_0_5px_orange]"
                          : "bg-blue-500 shadow-[0_0_5px_blue]"
                    }`}
                  ></span>
                  <span
                    className={`${log.errorName.includes("Reject") ? "text-red-400 font-bold" : "text-slate-300"} truncate`}
                  >
                    {log.errorName}
                  </span>
                </div>
                <div className="col-span-2 text-right font-bold text-slate-300">
                  {log.length}{" "}
                  <span className="text-[12px] text-slate-600 font-normal">
                    {log.length !== "-" ? "mm" : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-right">
        <span className="text-[12px] text-slate-500 font-mono tracking-widest uppercase">
          Tổng số:{" "}
          <strong className="text-cyan-500">{filteredLogs.length}</strong> sự
          kiện
        </span>
      </div>
    </div>
  );
}); // <-- NHỚ ĐÓNG NGOẶC CỦA React.memo ở đây

export default SystemLogs;
