import { useState, useRef, useEffect } from "react";

function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const times: { label: string; value: string }[] = [];
    for (let h = 6; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const date = new Date();
        date.setHours(h, m, 0);
        const value = date.toTimeString().slice(0, 5); // e.g. "08:30"
        const label = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }); // e.g. "8:30 AM"
        times.push({ value, label });
      }
    }
    return times;
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-[110px] rounded border px-2 py-1 text-sm disabled:opacity-40 h-8 overflow-y-auto"
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        backgroundPosition: "right 0.5rem center",
        backgroundRepeat: "no-repeat",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      }}
    >
      <option value="">--</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}