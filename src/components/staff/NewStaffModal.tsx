import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const defaultAvailability = [
  { weekday: 'monday', start_time: '', end_time: '' },
  { weekday: 'tuesday', start_time: '', end_time: '' },
  { weekday: 'wednesday', start_time: '', end_time: '' },
  { weekday: 'thursday', start_time: '', end_time: '' },
  { weekday: 'friday', start_time: '', end_time: '' },
  { weekday: 'saturday', start_time: '', end_time: '' },
  { weekday: 'sunday', start_time: '', end_time: '' },
];

const NewStaffModal = ({ open, onOpenChange, onCreated }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar_url, setAvatarUrl] = useState('');
  const [availability, setAvailability] = useState(defaultAvailability);

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  };

  const handleSave = async () => {
    const { data, error } = await supabase.from('barbers').insert([
      {
        name,
        role,
        phone,
        email,
        avatar_url,
        availability,
        start_date: new Date().toISOString().split('T')[0],
      },
    ]).select('*').single();

    if (!error && data) {
      onCreated(data);
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Nuovo Membro dello Staff</h2>

        <div className="space-y-4">
          <input className="w-full border p-2 rounded" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Ruolo" value={role} onChange={(e) => setRole(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Avatar URL" value={avatar_url} onChange={(e) => setAvatarUrl(e.target.value)} />

          <div>
            <h3 className="text-sm font-medium mb-2">Orari Settimanali</h3>
            <div className="space-y-2">
              {availability.map((slot, i) => (
                <div key={slot.weekday} className="flex items-center gap-2">
                  <span className="capitalize w-20">{slot.weekday}</span>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => handleAvailabilityChange(i, 'start_time', e.target.value)}
                    className="border p-1 rounded w-[100px]"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => handleAvailabilityChange(i, 'end_time', e.target.value)}
                    className="border p-1 rounded w-[100px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
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
