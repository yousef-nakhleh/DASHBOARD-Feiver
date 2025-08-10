import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const NewStaffModal = ({ open, onOpenChange, onCreated }) => {
  const { profile } = useAuth(); // 👈 take business_id from context

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState(
    weekdays.map((day) => ({ weekday: day.toLowerCase(), start_time: '', end_time: '' }))
  );

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...weeklyAvailability];
    updated[index][field] = value;
    setWeeklyAvailability(updated);
  };

  const handleSave = async () => {
    if (!profile?.business_id) {
      alert('Profilo non configurato (manca business_id). Contatta l’amministratore.');
      return;
    }

    let avatarUrl: string | null = null;

    // Upload avatar to Supabase Storage (optional)
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const fileName = `${profile.business_id}/${Date.now()}.${ext}`; // 👈 bucket path namespaced by business
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Errore durante l’upload dell’avatar.');
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = publicUrlData?.publicUrl || null;
    }

    // Insert barber, tied to current business
    const { data: newStaff, error: staffError } = await supabase
      .from('barbers')
      .insert([{
        name,
        phone,
        email,
        avatar_url: avatarUrl,
        business_id: profile.business_id,         // 👈 dynamic
      }])
      .select()
      .single();

    if (staffError) {
      console.error('Error saving barber:', staffError);
      alert('Errore durante il salvataggio dello staff.');
      return;
    }

    // Insert weekly availability (only filled rows), also tied to business
    const availabilityInserts = weeklyAvailability
      .filter((a) => a.start_time && a.end_time)
      .map((a) => ({
        ...a,
        barber_id: newStaff.id,
        business_id: profile.business_id,        // 👈 dynamic
      }));

    if (availabilityInserts.length > 0) {
      const { error: availabilityError } = await supabase
        .from('barbers_availabilities')
        .insert(availabilityInserts);

      if (availabilityError) {
        console.error('Error saving availability:', availabilityError);
        alert('Errore durante il salvataggio delle disponibilità.');
        return;
      }
    }

    onCreated(newStaff);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Nuovo Staff</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Nome</label>
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Telefono</label>
            <input
              type="text"
              placeholder="Numero di telefono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Email</label>
            <input
              type="email"
              placeholder="Indirizzo email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-4">Orari Settimanali</label>
            <div className="space-y-3">
              {weeklyAvailability.map((slot, i) => (
                <div key={slot.weekday} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium text-black capitalize">{slot.weekday}</span>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => handleAvailabilityChange(i, 'start_time', e.target.value)}
                    className="border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => handleAvailabilityChange(i, 'end_time', e.target.value)}
                    className="border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={() => onOpenChange(false)}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors"
          >
            Salva Staff
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStaffModal;