import { useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
};

function generateTimes() {
  const times: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "am" : "pm";
      const minute = m.toString().padStart(2, "0");
      times.push(`${hour}:${minute}${ampm}`);
    }
  }
  return times;
}

const options = generateTimes();

export default function TimeSelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-[96px] rounded border px-2 py-1 text-sm text-left ${
          disabled ? "opacity-40" : ""
        }`}
      >
        {value || "--:--"}
      </button>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 max-h-48 w-[96px] overflow-y-auto rounded border bg-white shadow">
          {options.map((t) => (
            <div
              key={t}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`cursor-pointer px-2 py-1 text-sm hover:bg-gray-100 ${
                value === t ? "bg-gray-100 font-medium" : ""
              }`}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}