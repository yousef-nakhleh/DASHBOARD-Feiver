import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface NewContact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone_number_e164: string | null;
}

interface NewContactFormProps {
  onCreated: (newContact: NewContact) => void;
  onCancel?: () => void;
}

const constraintToMessage = (msg: string) => {
  // Postgres unique violation = 23505; Supabase surfaces the constraint name in message/details
  const m = msg.toLowerCase();

  if (m.includes('uniq_contacts_phone_per_business')) {
    return 'Attenzione: esiste già un contatto con questo numero di telefono.';
  }
  if (m.includes('uniq_contacts_email_per_business')) {
    return 'Attenzione: esiste già un contatto con questa email.';
  }
  // Fallbacks
  if (m.includes('duplicate key value')) {
    return 'Attenzione: esiste già un contatto con gli stessi dati.';
  }
  return 'Si è verificato un errore durante il salvataggio del cliente.';
};

const emailLooksValid = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const LOCAL_STORAGE_KEY = 'newContactFormDraft';

const NewContactForm: React.FC<NewContactFormProps> = ({ onCreated, onCancel }) => {
  const { profile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phoneNumberRaw, setPhoneNumberRaw] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setFirstName(parsedDraft.firstName || '');
        setLastName(parsedDraft.lastName || '');
        setPhonePrefix(parsedDraft.phonePrefix || '+39');
        setPhoneNumberRaw(parsedDraft.phoneNumberRaw || '');
        setEmail(parsedDraft.email || '');
        setBirthdate(parsedDraft.birthdate || '');
      }
    } catch (e) {
      console.error("Failed to load draft from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Save draft to localStorage on form field changes (debounced)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const draftData = { firstName, lastName, phonePrefix, phoneNumberRaw, email, birthdate };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [firstName, lastName, phonePrefix, phoneNumberRaw, email, birthdate]);

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
    const { data, error } = await supabase.from('contacts').insert({
      business_id: profile.business_id,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      phone_prefix: phonePrefix,
      phone_number_raw: raw,
      email: email.trim() || null,
      birthdate: birthdate || null,
    }).select('id, first_name, last_name, email, phone_number_e164').single();

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

    // Success → clear form and notify parent with new contact data
    const newContact: NewContact = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name || '',
      full_name: `${data.first_name} ${data.last_name || ''}`.trim(),
      email: data.email,
      phone_number_e164: data.phone_number_e164,
    };

    setFirstName('');
    setLastName('');
    setPhonePrefix('+39');
    setPhoneNumberRaw('');
    setEmail('');
    setBirthdate('');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onCreated(newContact);
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

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={() => {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              onCancel();
            }}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            Annulla
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : 'Salva Cliente'}
        </button>
      </div>
    </div>
  );
};

export default NewContactForm;