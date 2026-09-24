import { useState, useRef, useEffect, useMemo } from "react";
import {
  JALALI_MONTH_NAMES,
  getJalaliMonthDays,
  gregorianToJalali,
  jalaliToGregorian,
  formatJalaliDate,
  toPersianDigits,
} from "@gecut-cloud/contracts";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface JalaliDatePickerProps {
  value?: string | Date | null;
  onChange: (isoString: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
  align?: "right" | "left";
}

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ...",
  label,
  error,
  className = "",
  disabled = false,
  minYear,
  maxYear,
  align = "right",
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value to Jalali, or default to current date
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return gregorianToJalali(d);
  }, [value]);

  const todayJalali = useMemo(() => gregorianToJalali(new Date()), []);

  const [viewYear, setViewYear] = useState<number>(() => parsedValue?.jy || todayJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(() => parsedValue?.jm || todayJalali.jm);

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.jy);
      setViewMonth(parsedValue.jm);
    }
  }, [parsedValue?.jy, parsedValue?.jm]);

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = useMemo(() => {
    return getJalaliMonthDays(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const startDayOfWeek = useMemo(() => {
    const firstDay = jalaliToGregorian(viewYear, viewMonth, 1);
    return (firstDay.getDay() + 1) % 7;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const gregDate = jalaliToGregorian(viewYear, viewMonth, day);
    onChange(gregDate.toISOString());
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const gregDate = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    setViewYear(todayJalali.jy);
    setViewMonth(todayJalali.jm);
    onChange(gregDate.toISOString());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const displayText = useMemo(() => {
    if (!value) return "";
    return formatJalaliDate(value);
  }, [value]);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const currentY = todayJalali.jy;
    const minY = minYear ?? Math.min(viewYear, currentY - 5);
    const maxY = maxYear ?? Math.max(viewYear, currentY + 10);
    for (let y = minY; y <= maxY; y++) {
      years.push(y);
    }
    return years;
  }, [todayJalali.jy, minYear, maxYear, viewYear]);

  return (
    <div ref={containerRef} className={`relative ${isOpen ? "z-50" : "z-10"} flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
        </label>
      )}

      {/* Picker Trigger Input */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-between rounded-xl border border-input bg-background/50 px-3.5 py-2 text-sm shadow-xs backdrop-blur-xs transition-all cursor-pointer hover:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 ${
          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        } ${isOpen ? "ring-2 ring-emerald-500/20 border-emerald-500" : ""}`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className={displayText ? "text-foreground font-medium" : "text-muted-foreground"}>
            {displayText || placeholder}
          </span>
        </div>

        {displayText && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="پاک کردن"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}

      {/* Popover Calendar */}
      {isOpen && (
        <div className={`absolute z-50 top-[calc(100%+6px)] ${align === "left" ? "left-0" : "right-0"} w-72 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 notranslate`}>
          {/* Calendar Header: Month, Year, Controls */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {JALALI_MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {WEEK_DAYS.map((w, idx) => (
              <div key={idx} className={idx === 6 ? "text-rose-500 font-bold" : ""}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-8 w-8" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsedValue?.jy === viewYear &&
                parsedValue?.jm === viewMonth &&
                parsedValue?.jd === day;
              const isToday =
                todayJalali.jy === viewYear &&
                todayJalali.jm === viewMonth &&
                todayJalali.jd === day;
              const dayOfWeek = (startDayOfWeek + i) % 7;
              const isFriday = dayOfWeek === 6;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg font-medium transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white font-bold shadow-xs scale-105"
                      : isToday
                        ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        : isFriday
                          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline px-1"
            >
              امروز: {toPersianDigits(todayJalali.jd)} {JALALI_MONTH_NAMES[todayJalali.jm - 1]}{" "}
              {toPersianDigits(todayJalali.jy)}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
