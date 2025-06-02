import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const defaultDay = () => ({ enabled: false, slots: [{ start_time: '', end_time: '' }] });

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

const EditStaffAvailabilityModal = ({ open, onClose, staffId, onUpdated }) => {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !staffId) return;

    const fetchAvailability = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbers_availabilities')
        .select('*')
        .eq('barber_id', staffId);

      const initial = {};
      weekdays.forEach((day) => (initial[day] = defaultDay()));

      if (data) {
        data.forEach(({ weekday, start_time, end_time }) => {
          const day = weekday.charAt(0).toUpperCase() + weekday.slice(1);
          if (!initial[day].enabled) initial[day].enabled = true;
          initial[day].slots.push({ start_time, end_time });
        });
        // remove the first empty default slot if data exists
        weekdays.forEach((day) => {
          if (initial[day].slots.length > 1 && initial[day].slots[0].start_time === '') {
            initial[day].slots.shift();
          }
        });
      }

      setAvailability(initial);
      setLoading(false);
    };

    fetchAvailability();
  }, [open, staffId]);

  const handleToggleDay = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleChange = (day, index, field, value) => {
    const newSlots = [...availability[day].slots];
    newSlots[index][field] = value;
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
  };

  const handleAddSlot = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start_time: '', end_time: '' }],
      },
    }));
  };

  const handleRemoveSlot = (day, index) => {
    const newSlots = [...availability[day].slots];
    newSlots.splice(index, 1);
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
  };

  const handleSave = async () => {
    const { error: deleteErr } = await supabase
      .from('barbers_availabilities')
      .delete()
      .eq('barber_id', staffId);

    const inserts = [];
    weekdays.forEach((day) => {
      if (availability[day].enabled) {
        availability[day].slots.forEach((slot) => {
          if (slot.start_time && slot.end_time) {
            inserts.push({
              barber_id: staffId,
              weekday: day.toLowerCase(),
              start_time: slot.start_time,
              end_time: slot.end_time,
            });
          }
        });
      }
    });

    if (inserts.length > 0) {
      const { error: insertErr } = await supabase.from('barbers_availabilities').insert(inserts);
      if (insertErr) {
        console.error('Insert error:', insertErr);
        return;
      }
    }

    onUpdated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[600px] max-h-[90vh] overflow-y-auto rounded-lg shadow p-6 relative">
        <h2 className="text-lg font-semibold mb-4">Modifica Disponibilità</h2>

        {loading ? (
          <p>Caricamento...</p>
        ) : (
          weekdays.map((day) => (
            <div key={day} className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={availability[day].enabled}
                  onChange={() => handleToggleDay(day)}
                  className="mr-2"
                />
                <span className="font-medium w-24">{day}</span>
              </div>

              {availability[day].enabled && (
                <div className="space-y-2 pl-6">
                  {availability[day].slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={slot.start_time}
                        onChange={(e) => handleChange(day, idx, 'start_time', e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">--:--</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>

                      <span>→</span>

                      <select
                        value={slot.end_time}
                        onChange={(e) => handleChange(day, idx, 'end_time', e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">--:--</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>

                      {availability[day].slots.length > 1 && (
                        <button
                          onClick={() => handleRemoveSlot(day, idx)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => handleAddSlot(day)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + Aggiungi intervallo
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#5D4037] text-white rounded hover:bg-[#4E342E]"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStaffAvailabilityModal;