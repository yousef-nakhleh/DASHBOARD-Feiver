import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!businessId) {
      setError('Profilo non configurato (manca business_id). Contatta l\'amministratore.');
      return;
    }

    if (!firstName.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error: contactError } = await supabase
        .from('contacts')
        .insert({
          business_id: businessId,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          phone_number_raw: phone.trim() || null,
          phone_prefix: phone.trim() ? '+39' : null,
          email: email.trim() || null,
          birthdate: birthdate || null,
          notes: notes.trim() || null,
        });

      if (contactError) {
        throw contactError;
      }

      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setBirthdate('');
      setNotes('');
      
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating contact:', err);
      setError(err.message || 'Errore durante la creazione del contatto');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setBirthdate('');
    setNotes('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Nuovo Cliente</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Nome *</label>
              <input
                type="text"
                placeholder="Nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">Cognome</label>
              <input
                type="text"
                placeholder="Cognome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Telefono</label>
            <input
              type="tel"
              placeholder="Numero di telefono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Data di nascita</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Note</label>
            <textarea
              placeholder="Note aggiuntive (opzionale)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black resize-none"
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            disabled={saving}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !firstName.trim()}
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewContactModal;