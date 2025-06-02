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
            slots: daySlots.length > 0 ? daySlots.map((s) => ({
              start_time: s.start_time,
              end_time: s.end_time,
            })) : [{ start_time: '', end_time: '' }],
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
      console.error('Failed to delete old availability:', deleteError);
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

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Modifica Disponibilità</h2>
        {loading ? (
          <p className="text-center text-gray-500">Caricamento...</p>
        ) : (
          <div className="space-y-5">
            {availability.map((day, i) => (
              <div key={day.weekday}>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={() => handleToggle(i)}
                    className="form-checkbox h-5 w-5 text-[#5D4037]"
                  />
                  <span className="capitalize font-medium">{day.weekday}</span>
                </label>
                {day.enabled && (
                  <div className="space-y-2 pl-6">
                    {day.slots.map((slot, j) => (
                      <div key={j} className="flex gap-2 items-center">
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
                            className="text-sm text-red-600 hover:underline"
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