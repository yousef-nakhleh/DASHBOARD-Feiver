// src/components/staff/EditStaffAvailabilityModal.tsx

import { useState, useEffect } from "react";
import { Switch } from "../ui/switch"; // ✅ relative import based on your folder
import { X, Plus, Copy } from "lucide-react";

const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

const EditStaffAvailabilityModal = () => {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(
    daysOfWeek.map((day) => ({
      weekday: day,
      enabled: false,
      slots: [{ start_time: "", end_time: "" }],
    }))
  );

  const handleSubmit = () => {
    setLoading(true);
    // Save logic here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div>
      {availability.map((day, index) => (
        <div key={day.weekday} className="mb-4">
          <div className="flex items-center gap-4">
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
              onChange={(e) => {
                const updated = [...availability];
                updated[index].slots[0].start_time = e.target.value;
                setAvailability(updated);
              }}
              className="border p-1"
            />
            <span>→</span>
            <input
              type="time"
              disabled={!day.enabled}
              value={day.slots[0].end_time}
              onChange={(e) => {
                const updated = [...availability];
                updated[index].slots[0].end_time = e.target.value;
                setAvailability(updated);
              }}
              className="border p-1"
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        {loading ? "Salvataggio..." : "Salva disponibilità"}
      </button>
    </div>
  );
};

export default EditStaffAvailabilityModal;