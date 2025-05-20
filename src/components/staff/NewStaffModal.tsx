import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const weekdays = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

const NewStaffModal = ({ open, onOpenChange, onCreated }: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availability, setAvailability] = useState(
    weekdays.map(day => ({ weekday: day, start_time: '', end_time: '' }))
  );

  const handleAvailabilityChange = (index: number, field: string, value: string) => {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  };

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('barbers')
      .insert([
        {
          name,
          phone,
          email,
          avatar_url: avatarUrl,
          availability,
        },
      ]);

    if (!error) {
      onCreated(data[0]);
      onOpenChange(false);
    } else {
      console.error(error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Aggiungi nuovo staff</h2>

        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="tel"
          placeholder="Telefono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mb-3 border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="url"
          placeholder="Avatar URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full mb-3 border border-gray-300 rounded px-3 py-2"
        />

        <h3 className="text-sm font-semibold mt-4 mb-2">Orari Settimanali</h3>
        <div className="space-y-2">
          {availability.map((slot, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-20 text-sm">{slot.weekday}</div>
              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => handleAvailabilityChange(i, 'start_time', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-[90px]"
              />
              <span>–</span>
              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => handleAvailabilityChange(i, 'end_time', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-[90px]"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStaffModal;