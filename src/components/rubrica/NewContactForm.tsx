// src/components/rubrica/NewContactForm.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const NewContactForm = ({ onCreated }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('rubrica').insert([
      {
        name: fullName,
        phone: phoneNumber,
        email,
        note,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Errore nel salvataggio del cliente');
      return;
    }

    if (onCreated) onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Numero di Telefono</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email (opzionale)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-[#5D4037] text-white rounded hover:bg-[#4E342E] transition"
      >
        {loading ? 'Salvataggio...' : 'Salva Cliente'}
      </button>
    </form>
  );
};

export default NewContactForm;