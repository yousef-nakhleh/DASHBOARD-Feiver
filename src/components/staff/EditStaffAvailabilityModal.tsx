import { useState, useEffect } from "react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { X, Plus, Copy } from "lucide-react";

const daysOfWeek = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export function EditStaffAvailabilityModal() {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(
    daysOfWeek.map((day) => ({
      weekday: day,
      enabled: false,
      slots: [{ start_time: "", end_time: "" }],
    }))
  );

  useEffect(() => {
    // Fetch or sync logic here if needed
  }, []);

  const toggleDay = (index: number) => {
    const updated = [...availability];
    updated[index].enabled = !updated[index].enabled;
    setAvailability(updated);
  };

  const handleTimeChange = (index: number, field: "start_time" | "end_time", value: string) => {
    const updated = [...availability];
    updated[index].slots[0][field] = value;
    setAvailability(updated);
  };

  const handleSubmit = () => {
    setLoading(true);
    // Submit logic here
    setTimeout(() => {
      setLoading(false);
      alert("Disponibilità salvata!");
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Disponibilità Settimanale</h2>
      {availability.map((day, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="w-24">{day.weekday}</span>
          <Switch checked={day.enabled} onCheckedChange={() => toggleDay(i)} />
          <input
            type="time"
            disabled={!day.enabled}
            value={day.slots[0].start_time}
            onChange={(e) => handleTimeChange(i, "start_time", e.target.value)}
            className="border p-1 rounded disabled:opacity-50"
          />
          <span>→</span>
          <input
            type="time"
            disabled={!day.enabled}
            value={day.slots[0].end_time}
            onChange={(e) => handleTimeChange(i, "end_time", e.target.value)}
            className="border p-1 rounded disabled:opacity-50"
          />
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Salvataggio..." : "Salva"}
      </Button>
    </div>
  );
}