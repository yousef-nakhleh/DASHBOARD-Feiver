import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface NewContactFormProps {
  onCreated: () => void; 
}

const NewContactForm: React.FC<NewContactFormProps> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !phone) return alert('Nome e telefono sono obbligatori');

    setSaving(true);

    const { error } = await supabase.from('contacts').insert({
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      customer_birthdate: birthdate || null,
    });

    setSaving(false);

    if (error) {
      console.error('Errore nel salvataggio del cliente:', error);
      alert('Errore nel salvataggio del cliente');
    } else {
      onCreated();
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-[#5D4037] focus:border-[#5D4037]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Numero di Telefono</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-[#5D4037] focus:border-[#5D4037]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email (opzionale)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-[#5D4037] focus:border-[#5D4037]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Data di Nascita</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-[#5D4037] focus:border-[#5D4037]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#5D4037] text-white py-2 rounded-md hover:bg-[#4E342E] transition"
      >
        {saving ? 'Salvataggio...' : 'Salva Cliente'}
      </button>
    </div>
  );
};

export default NewContactForm;