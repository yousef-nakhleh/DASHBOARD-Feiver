import { useState } from "react";
import { Switch } from "@/components/ui/switch"; // Radix UI switch
import { Button } from "@/components/ui/button";
import { X, Plus, Copy } from "lucide-react";

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

type Interval = { start: string; end: string };

export default function WeeklyAvailabilityModal() {
  const [availability, setAvailability] = useState<Record<string, {
    enabled: boolean;
    intervals: Interval[];
  }>>(() =>
    Object.fromEntries(daysOfWeek.map((day) => [day, {
      enabled: false,
      intervals: [{ start: "", end: "" }],
    }]))
  );

  const handleToggleDay = (day: string, enabled: boolean) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
      },
    }));
  };

  const handleTimeChange = (day: string, index: number, field: keyof Interval, value: string) => {
    const updated = [...availability[day].intervals];
    updated[index][field] = value;
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        intervals: updated,
      },
    }));
  };

  const addInterval = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        intervals: [...prev[day].intervals, { start: "", end: "" }],
      },
    }));
  };

  const duplicateDay = (day: string) => {
    const source = availability[day];
    const nextDay = daysOfWeek[(daysOfWeek.indexOf(day) + 1) % 7];
    setAvailability((prev) => ({
      ...prev,
      [nextDay]: {
        ...prev[nextDay],
        enabled: true,
        intervals: [...source.intervals],
      },
    }));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-lg space-y-4 overflow-y-auto max-h-[80vh]">
      {daysOfWeek.map((day) => (
        <div key={day} className="flex items-start gap-4">
          {/* Toggle + Label */}
          <div className="flex items-center w-32 shrink-0">
            <Switch
              checked={availability[day].enabled}
              onCheckedChange={(val) => handleToggleDay(day, val)}
            />
            <span className="ml-2 font-medium">{day}</span>
          </div>

          {/* Intervals */}
          <div className="flex flex-col gap-2 flex-1">
            {availability[day].intervals.map((interval, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="time"
                  value={interval.start}
                  disabled={!availability[day].enabled}
                  onChange={(e) => handleTimeChange(day, idx, "start", e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <span>-</span>
                <input
                  type="time"
                  value={interval.end}
                  disabled={!availability[day].enabled}
                  onChange={(e) => handleTimeChange(day, idx, "end", e.target.value)}
                  className="border rounded px-2 py-1"
                />
                {idx === 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addInterval(day)}
                      disabled={!availability[day].enabled}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateDay(day)}
                      disabled={!availability[day].enabled}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save / Close actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost">
          <X className="w-4 h-4 mr-1" />
          Chiudi
        </Button>
        <Button className="bg-[#5b3623] text-white hover:bg-[#472c1b]">
          Salva Disponibilità
        </Button>
      </div>
    </div>
  );
}