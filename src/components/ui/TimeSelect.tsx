import { useState, useRef, useEffect } from "react";

function CustomTimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const date = new Date();
      date.setHours(h, m);
      const val = date.toTimeString().slice(0, 5);
      const label = date.toLocaleTimeString("it-IT", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      options.push({ val, label });
    }
  }

  const selected = options.find((o) => o.val === value);

  useEffect(() => {
    const closeOnClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnClickOutside);
    return () => document.removeEventListener("mousedown", closeOnClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-[100px] px-2 py-1 text-sm border rounded ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-black"
        }`}
      >
        {selected?.label || "--"}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-56 w-[140px] overflow-y-auto rounded-lg border bg-white shadow-lg text-sm">
          {options.map((o) => (
            <div
              key={o.val}
              onClick={() => {
                onChange(o.val);
                setOpen(false);
              }}
              className={`px-3 py-1.5 cursor-pointer hover:bg-gray-100 ${
                value === o.val ? "bg-gray-100 font-medium" : ""
              }`}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}