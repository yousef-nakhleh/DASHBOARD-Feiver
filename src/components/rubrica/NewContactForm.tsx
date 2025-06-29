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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Nome Completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
          placeholder="Inserisci nome completo"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Numero di Telefono</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
          placeholder="Inserisci numero di telefono"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Email (opzionale)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
          placeholder="Inserisci indirizzo email"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Data di Nascita</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
      >
        {saving ? 'Salvataggio...' : 'Salva Cliente'}
      </button>
    </div>
  );
};

export default NewContactForm;