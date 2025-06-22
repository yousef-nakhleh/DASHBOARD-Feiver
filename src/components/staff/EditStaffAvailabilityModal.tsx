import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday', 
  'friday',
  'saturday',
  'sunday',
];

const EditStaffAvailabilityModal = ({ open, onClose, barberId }) => {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState(
    weekdays.map((day) => ({
      weekday: day,
      enabled: false,
      slots: [{ start_time: '', end_time: '' }],
    }))
  );

  useEffect(() => {
    if (!barberId) return;
    const fetchAvailability = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbers_availabilities')
        .select('*')
        .eq('barber_id', barberId);

      if (!error && data) {
        const grouped = weekdays.map((day) => {
          const daySlots = data.filter((a) => a.weekday === day);
          return {
            weekday: day,
            enabled: daySlots.length > 0,
            slots: daySlots.length > 0
              ? daySlots.map((s) => ({
                  start_time: s.start_time,
                  end_time: s.end_time,
                }))
              : [{ start_time: '', end_time: '' }],
          };
        });
        setAvailability(grouped);
      }
      setLoading(false);
    };
    fetchAvailability();
  }, [barberId]);

  const handleToggle = (dayIndex) => {
    const updated = [...availability];
    updated[dayIndex].enabled = !updated[dayIndex].enabled;
    if (updated[dayIndex].enabled && updated[dayIndex].slots.length === 0) {
      updated[dayIndex].slots.push({ start_time: '', end_time: '' });
    }
    setAvailability(updated);
  };

  const handleTimeChange = (dayIndex, slotIndex, field, value) => {
    const updated = [...availability];
    updated[dayIndex].slots[slotIndex][field] = value;
    setAvailability(updated);
  };

  const handleAddSlot = (dayIndex) => {
    const updated = [...availability];
    updated[dayIndex].slots.push({ start_time: '', end_time: '' });
    setAvailability(updated);
  };

  const handleRemoveSlot = (dayIndex, slotIndex) => {
    const updated = [...availability];
    updated[dayIndex].slots.splice(slotIndex, 1);
    if (updated[dayIndex].slots.length === 0) {
      updated[dayIndex].enabled = false;
      updated[dayIndex].slots = [{ start_time: '', end_time: '' }];
    }
    setAvailability(updated);
  };

  const handleSave = async () => {
    const { error: deleteError } = await supabase
      .from('barbers_availabilities')
      .delete()
      .eq('barber_id', barberId);
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return;
    }

    const inserts = [];
    availability.forEach((day) => {
      if (!day.enabled) return;
      day.slots.forEach((slot) => {
        if (slot.start_time && slot.end_time) {
          inserts.push({
            barber_id: barberId,
            weekday: day.weekday,
            start_time: slot.start_time,
            end_time: slot.end_time,
            business_id: '268e0ae9-c539-471c-b4c2-1663cf598436',
          });
        }
      });
    });

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('barbers_availabilities')
        .insert(inserts);
      if (insertError) {
        console.error('Insert error:', insertError);
      }
    }

    onClose();
  };

  if (!open) return null;

  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const h = String(Math.floor(i / 4)).padStart(2, '0');
    const m = String((i % 4) * 15).padStart(2, '0');
    return `${h}:${m}`;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-center">Modifica Disponibilità</h2>

        {loading ? (
          <p className="text-center text-gray-500">Caricamento...</p>
        ) : (
          <div className="space-y-6">
            {availability.map((day, i) => (
              <div key={day.weekday} className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="capitalize font-medium">{day.weekday}</span>
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Attivo</span>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => handleToggle(i)}
                      className="toggle toggle-sm"
                    />
                  </label>
                </div>

                {day.enabled && (
                  <div className="space-y-2">
                    {day.slots.map((slot, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <select
                          value={slot.start_time}
                          onChange={(e) => handleTimeChange(i, j, 'start_time', e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="">--:--</option>
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span>→</span>
                        <select
                          value={slot.end_time}
                          onChange={(e) => handleTimeChange(i, j, 'end_time', e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="">--:--</option>
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        {day.slots.length > 1 && (
                          <button
                            onClick={() => handleRemoveSlot(i, j)}
                            className="text-sm text-red-600 hover:underline ml-2"
                          >
                            Elimina
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddSlot(i)}
                      className="text-sm text-blue-600 hover:underline mt-1"
                    >
                      + Aggiungi intervallo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#5D4037] text-white rounded"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStaffAvailabilityModal;