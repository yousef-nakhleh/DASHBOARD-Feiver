import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_prefix: string;
  phone_number_raw: string;
  birthdate: string | null;
  notes: string | null;
}

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  defaultValues: Contact | null;
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

const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultValues,
}) => {
  const { profile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phoneNumberRaw, setPhoneNumberRaw] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with default values when modal opens or defaultValues change
  useEffect(() => {
    if (defaultValues) {
      setFirstName(defaultValues.first_name || '');
      setLastName(defaultValues.last_name || '');
      setPhonePrefix(defaultValues.phone_prefix || '+39');
      setPhoneNumberRaw(defaultValues.phone_number_raw || '');
      setEmail(defaultValues.email || '');
      setBirthdate(defaultValues.birthdate || '');
      setNotes(defaultValues.notes || '');
    } else {
      // Reset form when no default values
      setFirstName('');
      setLastName('');
      setPhonePrefix('+39');
      setPhoneNumberRaw('');
      setEmail('');
      setBirthdate('');
      setNotes('');
    }
    setFormError(null);
  }, [defaultValues, isOpen]);

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
    if (!defaultValues?.id) {
      setFormError("Errore: ID del contatto non trovato.");
      return;
    }

    setSaving(true);

    // Update contact with the same fields as NewContactForm
    const { error } = await supabase
      .from('contacts')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone_prefix: phonePrefix,
        phone_number_raw: raw,
        email: email.trim() || null,
        birthdate: birthdate || null,
        notes: notes.trim() || null,
      })
      .eq('id', defaultValues.id)
      .eq('business_id', profile.business_id); // Ensure we only update contacts from this business

    setSaving(false);

    if (error) {
      // Map Postgres errors to friendly copy
      const nice = error.code === '23505'
        ? constraintToMessage(error.message || error.details || '')
        : constraintToMessage(error.message || '');
      setFormError(nice);
      console.error('Supabase update error (contacts):', error);
      return;
    }

    // Success → notify parent and close modal
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Modifica Contatto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
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

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Note (opzionale)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black resize-none"
              placeholder="Inserisci note aggiuntive"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            disabled={saving}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditContactModal;