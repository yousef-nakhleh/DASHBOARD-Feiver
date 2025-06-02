// src/components/staff/EditStaffAvailabilityModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
};

const timeOptions = generateTimeSlots();

const EditStaffAvailabilityModal = ({ open, onClose, barberId, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    if (!open || !barberId) return;

    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbers_availabilities')
        .select('*')
        .eq('barber_id', barberId);

      if (!error) {
        const structured = {};
        weekdays.forEach(day => structured[day.toLowerCase()] = []);
        data.forEach(slot => {
          structured[slot.weekday]?.push({ start: slot.start_time, end: slot.end_time, id: slot.id });
        });
        setAvailability(structured);
      }
      setLoading(false);
    };

    fetchData();
  }, [open, barberId]);

  const handleToggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day]?.length ? [] : [{ start: '', end: '' }]
    }));
  };

  const handleTimeChange = (day, index, field, value) => {
    setAvailability(prev => {
      const updated = [...prev[day]];
      updated[index][field] = value;
      return { ...prev, [day]: updated };
    });
  };

  const addSlot = (day) => {
    setAvailability(prev => ({ ...prev, [day]: [...prev[day], { start: '', end: '' }] }));
  };

  const removeSlot = (day, index) => {
    setAvailability(prev => {
      const updated = prev[day].filter((_, i) => i !== index);
      return { ...prev, [day]: updated };
    });
  };

  const handleSave = async () => {
    await supabase.from('barbers_availabilities').delete().eq('barber_id', barberId);

    const toInsert = [];
    for (const day of Object.keys(availability)) {
      availability[day].forEach(({ start, end }) => {
        if (start && end) toInsert.push({ barber_id: barberId, weekday: day, start_time: start, end_time: end });
      });
    }

    if (toInsert.length) await supabase.from('barbers_availabilities').insert(toInsert);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Modifica Disponibilità</h2>
        {loading ? (
          <p>Caricamento...</p>
        ) : (
          <div className="space-y-4">
            {weekdays.map(day => {
              const key = day.toLowerCase();
              return (
                <div key={day} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">
                      <input
                        type="checkbox"
                        className="mr-2 accent-[#5D4037]"
                        checked={!!availability[key]?.length}
                        onChange={() => handleToggleDay(key)}
                      />
                      {day}
                    </label>
                    {availability[key]?.length > 0 && (
                      <button
                        className="text-sm text-blue-600"
                        onClick={() => addSlot(key)}
                      >
                        + Aggiungi intervallo
                      </button>
                    )}
                  </div>

                  {availability[key]?.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <select
                        value={slot.start}
                        onChange={(e) => handleTimeChange(key, index, 'start', e.target.value)}
                        className="border px-2 py-1 rounded w-[100px]"
                      >
                        <option value="">--:--</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span>→</span>
                      <select
                        value={slot.end}
                        onChange={(e) => handleTimeChange(key, index, 'end', e.target.value)}
                        className="border px-2 py-1 rounded w-[100px]"
                      >
                        <option value="">--:--</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {availability[key].length > 1 && (
                        <button
                          onClick={() => removeSlot(key, index)}
                          className="text-red-500 text-sm"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                className="bg-[#5D4037] text-white px-4 py-2 rounded"
              >
                Salva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStaffAvailabilityModal;
