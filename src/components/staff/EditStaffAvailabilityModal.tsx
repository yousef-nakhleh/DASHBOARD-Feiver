// src/components/staff/EditStaffAvailabilityModal.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { supabase } from "@/lib/supabase";
import { X, Plus } from "lucide-react";

const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

type Props = {
  barberId: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

const EditStaffAvailabilityModal = ({ barberId, open, onClose, onUpdated }: Props) => {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(
    daysOfWeek.map((day) => ({
      weekday: day,
      enabled: false,
      slots: [{ start_time: "", end_time: "" }],
    }))
  );

  useEffect(() => {
    if (!barberId) return;
    const fetchAvailability = async () => {
      const { data } = await supabase
        .from("barbers_availabilities")
        .select("*")
        .eq("barber_id", barberId);

      if (data) {
        const grouped = daysOfWeek.map((day) => {
          const slots = data.filter((slot) => slot.weekday === day);
          return {
            weekday: day,
            enabled: slots.length > 0,
            slots: slots.length > 0 ? slots : [{ start_time: "", end_time: "" }],
          };
        });
        setAvailability(grouped);
      }
    };

    fetchAvailability();
  }, [barberId]);

  const handleSubmit = async () => {
    setLoading(true);

    // Clear existing entries
    await supabase.from("barbers_availabilities").delete().eq("barber_id", barberId);

    // Insert new ones
    const entries = availability
      .filter((day) => day.enabled)
      .flatMap((day) =>
        day.slots.map((slot) => ({
          barber_id: barberId,
          weekday: day.weekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }))
      );

    if (entries.length > 0) {
      await supabase.from("barbers_availabilities").insert(entries);
    }

    setLoading(false);
    onUpdated();
  };

  const handleChange = (index: number, field: "start_time" | "end_time", value: string) => {
    const updated = [...availability];
    updated[index].slots[0][field] = value;
    setAvailability(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifica Disponibilità</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {availability.map((day, index) => (
            <div key={day.weekday} className="flex items-center gap-4">
              <span className="w-24">{day.weekday}</span>
              <Switch
                checked={day.enabled}
                onCheckedChange={(val) => {
                  const updated = [...availability];
                  updated[index].enabled = val;
                  setAvailability(updated);
                }}
              />
              <input
                type="time"
                disabled={!day.enabled}
                value={day.slots[0].start_time}
                onChange={(e) => handleChange(index, "start_time", e.target.value)}
                className="border px-2 py-1 rounded"
              />
              <span>→</span>
              <input
                type="time"
                disabled={!day.enabled}
                value={day.slots[0].end_time}
                onChange={(e) => handleChange(index, "end_time", e.target.value)}
                className="border px-2 py-1 rounded"
              />
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
          >
            {loading ? "Salvataggio..." : "Salva disponibilità"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffAvailabilityModal;