import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EditStaffAvailabilityModal = ({ open, onClose, barberId, onUpdated }) => {
  const [weeklyAvailability, setWeeklyAvailability] = useState(
    weekdays.map((day) => ({ weekday: day.toLowerCase(), start_time: '', end_time: '' }))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!barberId || !open) return;

    const fetchAvailability = async () => {
      const { data, error } = await supabase
        .from('barbers_availabilities')
        .select('*')
        .eq('barber_id', barberId);

      if (!error && data) {
        const updated = weekdays.map((day) => {
          const record = data.find((a) => a.weekday === day.toLowerCase());
          return {
            weekday: day.toLowerCase(),
            start_time: record?.start_time || '',
            end_time: record?.end_time || '',
          };
        });
        setWeeklyAvailability(updated);
      }
    };

    fetchAvailability();
  }, [barberId, open]);

  const handleChange = (index, field, value) => {
    const updated = [...weeklyAvailability];
    updated[index][field] = value;
    setWeeklyAvailability(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    // 1. Delete old records
    await supabase.from('barbers_availabilities').delete().eq('barber_id', barberId);

    // 2. Insert new ones
    const toInsert = weeklyAvailability
      .filter((a) => a.start_time && a.end_time)
      .map((a) => ({ ...a, barber_id: barberId }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from('barbers_availabilities').insert(toInsert);
      if (error) {
        console.error('Error saving availability:', error);
      }
    }

    setLoading(false);
    onUpdated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
        <h2 className="text-lg font-semibold mb-4">Modifica Disponibilità</h2>

        <div>
          {weeklyAvailability.map((slot, i) => (
            <div key={slot.weekday} className="flex items-center gap-2 mb-2">
              <span className="w-20 text-sm">
                {slot.weekday.charAt(0).toUpperCase() + slot.weekday.slice(1)}
              </span>
              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => handleChange(i, 'start_time', e.target.value)}
                className="border px-2 py-1 rounded"
              />
              <span>→</span>
              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => handleChange(i, 'end_time', e.target.value)}
                className="border px-2 py-1 rounded"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            disabled={loading}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStaffAvailabilityModal;
