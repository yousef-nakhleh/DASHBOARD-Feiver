import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface NewContactFormProps {
  onCreated: () => void; 
}

const NewContactForm: React.FC<NewContactFormProps> = ({ onCreated }) => {
  const { profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phoneNumberRaw, setPhoneNumberRaw] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName || !phoneNumberRaw) return alert('Nome e telefono sono obbligatori');
    if (!profile?.business_id) {
      alert('Profilo non configurato. Contatta l\'amministratore.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('contacts').insert({
      business_id: profile.business_id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_prefix: phonePrefix,
      phone_number_raw: phoneNumberRaw.trim(),
      email: email || null,
      birthdate: birthdate || null,
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
        <label className="block text-sm font-semibold text-black mb-2">Nome</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
          placeholder="Inserisci nome"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Cognome</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
          placeholder="Inserisci cognome"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">Numero di Telefono</label>
        <div className="flex gap-3">
          <select
            value={phonePrefix}
            onChange={(e) => setPhonePrefix(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white w-24"
          >
            <option value="+39">+39</option>
            <option value="+1">+1</option>
            <option value="+33">+33</option>
            <option value="+49">+49</option>
            <option value="+34">+34</option>
          </select>
          <input
            type="tel"
            value={phoneNumberRaw}
            onChange={(e) => setPhoneNumberRaw(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            placeholder="Inserisci numero di telefono"
          />
        </div>
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