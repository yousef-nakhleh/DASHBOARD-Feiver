import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const weekdays = ['Lunedi', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const NewStaffModal = ({ open, onOpenChange, onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState(
    weekdays.map((day) => ({ weekday: day.toLowerCase(), start_time: '', end_time: '' }))
  );

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...weeklyAvailability];
    updated[index][field] = value;
    setWeeklyAvailability(updated);
  };

  const handleSave = async () => {
    let avatarUrl = null;

    // Upload avatar to Supabase Storage
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = publicUrlData?.publicUrl || null;
    }

    const { data: newStaff, error: staffError } = await supabase
      .from('barbers')
      .insert([{ name, phone, email, avatar_url: avatarUrl }])
      .select()
      .single();

    if (staffError) {
      console.error('Error saving barber:', staffError);
      return;
    }

    const availabilityInserts = weeklyAvailability
      .filter((a) => a.start_time && a.end_time)
      .map((a) => ({ ...a, barber_id: newStaff.id }));

    if (availabilityInserts.length > 0) {
      const { error: availabilityError } = await supabase
        .from('barbers_availabilities')
        .insert(availabilityInserts);

      if (availabilityError) {
        console.error('Error saving availability:', availabilityError);
        return;
      }
    }

    onCreated(newStaff);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
        <h2 className="text-lg font-semibold mb-4">Nuovo Staff</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Telefono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orari Settimanali</label>
            {weeklyAvailability.map((slot, i) => (
              <div key={slot.weekday} className="flex items-center gap-2 mb-1">
                <span className="w-20 text-sm">{slot.weekday.charAt(0).toUpperCase() + slot.weekday.slice(1)}</span>
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => handleAvailabilityChange(i, 'start_time', e.target.value)}
                  className="border px-2 py-1 rounded"
                />
                <span>→</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => handleAvailabilityChange(i, 'end_time', e.target.value)}
                  className="border px-2 py-1 rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewStaffModal;
