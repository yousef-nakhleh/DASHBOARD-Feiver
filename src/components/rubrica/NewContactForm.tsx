import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface NewContactFormProps {
  onCreated: () => void;
}

const constraintToMessage = (msg: string) => {
  // Postgres unique violation = 23505; Supabase surfaces the constraint name in message/details
  const m = msg.toLowerCase();

  if (m.includes('uniq_contacts_phone_per_business')) {
    return 'Attenzione: esiste già un contatto con questo numero di telefono per questo negozio.';
  }
  if (m.includes('uniq_contacts_email_per_business')) {
    return 'Attenzione: esiste già un contatto con questa email per questo negozio.';
  }
  // Fallbacks
  if (m.includes('duplicate key value')) {
    return 'Attenzione: esiste già un contatto con gli stessi dati.';
  }
  return 'Si è verificato un errore durante il salvataggio del cliente.';
};

const emailLooksValid = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const NewContactForm: React.FC<NewContactFormProps> = ({ onCreated }) => {
  const { profile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phoneNumberRaw, setPhoneNumberRaw] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    setFormError(null);

    // Basic client-side validation (keep it gentle; DB still the source of truth)
    if (!firstName.trim()) {
      setFormError('Il nome è obbligatorio.');
      return;
    }
    const raw = phoneNumberRaw.trim();
    if (!raw) {
      setFormError('Il numero di telefono è obbligatorio.');
      return;
    }
    if (email && !emailLooksValid(email)) {
      setFormError('Inserisci un indirizzo email valido.');
      return;
    }
    if (!profile?.business_id) {
      setFormError("Profilo non configurato. Contatta l'amministratore.");
      return;
    }

    setSaving(true);

    // Keep exactly what the backend expects:
    // - phone_prefix (e.g. "+39")
    // - phone_number_raw (as typed; DB trigger will normalize/build E.164)
    // - email and birthdate are optional
    const { error } = await supabase.from('contacts').insert({
      business_id: profile.business_id,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      phone_prefix: phonePrefix,
      phone_number_raw: raw,
      email: email.trim() || null,
      birthdate: birthdate || null,
    });

    setSaving(false);

    if (error) {
      // Map Postgres errors to friendly copy
      const nice = error.code === '23505'
        ? constraintToMessage(error.message || error.details || '')
        : constraintToMessage(error.message || '');
      setFormError(nice);
      console.error('Supabase insert error (contacts):', error);
      return;
    }

    // Success → clear form and notify parent
    setFirstName('');
    setLastName('');
    setPhonePrefix('+39');
    setPhoneNumberRaw('');
    setEmail('');
    setBirthdate('');
    onCreated();
  };

  return (
    <div className="space-y-6">
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

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