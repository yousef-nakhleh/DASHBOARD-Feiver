import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = String(h).padStart(2, '0');
      const minute = String(m).padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const EditStaffAvailabilityModal = ({ open, onClose, barberId, existingAvailability = [] }) => {
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    const initial = {};
    weekdays.forEach((day) => {
      initial[day.toLowerCase()] = [];
    });

    existingAvailability.forEach((slot) => {
      const day = slot.weekday.toLowerCase();
      if (!initial[day]) initial[day] = [];
      initial[day].push({ start_time: slot.start_time, end_time: slot.end_time });
    });

    setAvailability(initial);
  }, [existingAvailability]);

  const handleToggleDay = (day) => {
    const key = day.toLowerCase();
    if (availability[key]?.length) {
      setAvailability({ ...availability, [key]: [] });
    } else {
      setAvailability({ ...availability, [key]: [{ start_time: '', end_time: '' }] });
    }
  };

  const handleChange = (day, index, field, value) => {
    const updatedDay = [...availability[day]];
    updatedDay[index][field] = value;
    setAvailability({ ...availability, [day]: updatedDay });
  };

  const handleAddTimeRange = (day) => {
    setAvailability({
      ...availability,
      [day]: [...availability[day], { start_time: '', end_time: '' }]
    });
  };

  const handleRemoveTimeRange = (day, index) => {
    const updatedDay = [...availability[day]];
    updatedDay.splice(index, 1);
    setAvailability({ ...availability, [day]: updatedDay });
  };

  const handleSave = async () => {
    await supabase.from('barbers_availabilities').delete().eq('barber_id', barberId);

    const inserts = [];
    for (const day in availability) {
      availability[day].forEach(({ start_time, end_time }) => {
        if (start_time && end_time) {
          inserts.push({ barber_id: barberId, weekday: day, start_time, end_time });
        }
      });
    }

    if (inserts.length > 0) {
      await supabase.from('barbers_availabilities').insert(inserts);
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto relative">
        <button className="absolute top-2 right-2" onClick={onClose}>
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Modifica Disponibilità</h2>

        <div className="space-y-4">
          {weekdays.map((day) => {
            const key = day.toLowerCase();
            const isActive = availability[key]?.length > 0;
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleToggleDay(day)}
                      className="accent-[#5D4037]"
                    />
                    <span className="font-medium w-20">{day}</span>
                  </label>
                  {isActive && (
                    <button
                      onClick={() => handleAddTimeRange(key)}
                      className="text-sm text-[#5D4037] font-medium hover:underline"
                    >
                      + Aggiungi intervallo
                    </button>
                  )}
                </div>

                {isActive && availability[key].map((range, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 ml-7">
                    <select
                      value={range.start_time}
                      onChange={(e) => handleChange(key, i, 'start_time', e.target.value)}
                      className="border px-2 py-1 rounded w-28"
                    >
                      <option value="">--:--</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <span>→</span>
                    <select
                      value={range.end_time}
                      onChange={(e) => handleChange(key, i, 'end_time', e.target.value)}
                      className="border px-2 py-1 rounded w-28"
                    >
                      <option value="">--:--</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    {availability[key].length > 1 && (
                      <button
                        onClick={() => handleRemoveTimeRange(key, i)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
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