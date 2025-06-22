import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

const daysOfWeek = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

/* ---------- types ---------- */
type Slot = { start_time: string; end_time: string };
type Day = { weekday: string; enabled: boolean; slots: Slot[] };
type Props = {
  barberId: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

/* ---------- helpers ---------- */
const emptySlot: Slot = { start_time: "", end_time: "" };
const defaultState: Day[] = daysOfWeek.map((d) => ({
  weekday: d,
  enabled: false,
  slots: [{ ...emptySlot }],
}));

/* ---------- embedded time select ---------- */
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
        const value = date.toTimeString().slice(0, 5);
        const label = date.toLocaleTimeString("it-IT", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
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
      className="w-[96px] rounded border px-2 py-1 text-sm disabled:opacity-40"
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

/* ---------- component ---------- */
export default function EditStaffAvailabilityModal({
  barberId,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Day[]>(defaultState);

  useEffect(() => {
    if (!barberId) return;

    (async () => {
      const { data } = await supabase
        .from("barbers_availabilities")
        .select("*")
        .eq("barber_id", barberId);

      if (!data) return;

      const next = daysOfWeek.map((day) => {
        const slots = data.filter((s) => s.weekday === day);
        return {
          weekday: day,
          enabled: slots.length > 0,
          slots: slots.length ? slots : [{ ...emptySlot }],
        };
      });
      setAvailability(next);
    })();
  }, [barberId]);

  const toggleDay = (idx: number, val: boolean) => {
    setAvailability((prev) =>
      prev.map((d, i) =>
        i === idx ? { ...d, enabled: val } : d,
      ),
    );
  };

  const updateSlot = (dIdx: number, sIdx: number, field: keyof Slot, val: string) => {
    setAvailability((prev) =>
      prev.map((d, i) =>
        i !== dIdx
          ? d
          : {
              ...d,
              slots: d.slots.map((s, j) =>
                j === sIdx ? { ...s, [field]: val } : s,
              ),
            },
      ),
    );
  };

  const addSlot = (dIdx: number) => {
    setAvailability((prev) =>
      prev.map((d, i) =>
        i === dIdx ? { ...d, slots: [...d.slots, { ...emptySlot }] } : d,
      ),
    );
  };

  const removeSlot = (dIdx: number, sIdx: number) => {
    setAvailability((prev) =>
      prev.map((d, i) =>
        i === dIdx
          ? {
              ...d,
              slots: d.slots.filter((_, j) => j !== sIdx) || [{ ...emptySlot }],
            }
          : d,
      ),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await supabase.from("barbers_availabilities").delete().eq("barber_id", barberId);

    const inserts = availability
      .filter((d) => d.enabled)
      .flatMap((d) =>
        d.slots
          .filter((s) => s.start_time && s.end_time)
          .map((s) => ({
            barber_id: barberId,
            weekday: d.weekday,
            ...s,
          })),
      );

    if (inserts.length) await supabase.from("barbers_availabilities").insert(inserts);
    setLoading(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[540px] px-6 py-5">
        <DialogHeader>
          <DialogTitle className="text-lg">Modifica Disponibilità</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {availability.map((day, dIdx) => (
            <div key={day.weekday} className="flex items-center gap-4">
              <div className="flex items-center gap-3 min-w-[110px]">
                <Switch
                  checked={day.enabled}
                  onCheckedChange={(v) => toggleDay(dIdx, v)}
                />
                <span className="text-sm">{day.weekday}</span>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {day.slots.map((slot, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2">
                    <TimeSelect
                      value={slot.start_time}
                      disabled={!day.enabled}
                      onChange={(val) =>
                        updateSlot(dIdx, sIdx, "start_time", val)
                      }
                    />
                    <span className="select-none">–</span>
                    <TimeSelect
                      value={slot.end_time}
                      disabled={!day.enabled}
                      onChange={(val) =>
                        updateSlot(dIdx, sIdx, "end_time", val)
                      }
                    />

                    {day.enabled && (
                      <>
                        {sIdx === day.slots.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => addSlot(dIdx)}
                            className="p-1 text-gray-500 hover:text-black"
                          >
                            <Plus size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeSlot(dIdx, sIdx)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full rounded bg-[#1a1a1a] py-2 text-white disabled:opacity-50"
        >
          {loading ? "Salvataggio..." : "Salva disponibilità"}
        </button>
      </DialogContent>
    </Dialog>
  );
}