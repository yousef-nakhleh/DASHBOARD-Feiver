import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const NewStaffModal = ({ open, onOpenChange, onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [weeklyAvailability, setWeeklyAvailability] = useState(
    weekdays.reduce((acc, day) => {
      acc[day] = { start: '', end: '' };
      return acc;
    }, {})
  );

  const handleTimeChange = (day, field, value) => {
    setWeeklyAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    // Step 1: Insert the barber
    const { data: barberData, error: barberError } = await supabase
      .from('barbers')
      .insert([
        {
          name,
          phone,
          email,
          avatar_url: avatarUrl,
        },
      ])
      .select()
      .single();

    if (barberError) {
      console.error('Error saving barber:', barberError);
      return;
    }

    // Step 2: Insert availability
    const availabilityInserts = Object.entries(weeklyAvailability)
      .filter(([, times]) => times.start && times.end)
      .map(([weekday, times]) => ({
        barber_id: barberData.id,
        weekday,
        start_time: times.start,
        end_time: times.end,
      }));

    if (availabilityInserts.length > 0) {
      const { error: availError } = await supabase
        .from('barbers_availabilities')
        .insert(availabilityInserts);

      if (availError) {
        console.error('Error saving availability:', availError);
      }
    }

    // Callback and reset
    onCreated(barberData);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAvatarUrl('');
    setWeeklyAvailability(
      weekdays.reduce((acc, day) => {
        acc[day] = { start: '', end: '' };
        return acc;
      }, {})
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Nuovo Staff</h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Telefono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Avatar URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <h3 className="mt-4 mb-2 text-sm font-medium text-gray-700">
          Orari Settimanali
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {weekdays.map((day) => (
            <div key={day} className="flex items-center space-x-3">
              <div className="w-24 capitalize">{day}</div>
              <input
                type="time"
                value={weeklyAvailability[day].start}
                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                className="border px-2 py-1 rounded"
              />
              <span>→</span>
              <input
                type="time"
                value={weeklyAvailability[day].end}
                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                className="border px-2 py-1 rounded"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStaffModal;