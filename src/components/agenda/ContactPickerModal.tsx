import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Search } from 'lucide-react';

const ContactPickerModal = ({ onSelect, onClose, businessId }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchContacts = async (search?: string) => {
    if (!businessId) {
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let req = supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone_number_e164')
      .eq('business_id', businessId);

    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      req = req.or(
        `first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q},phone_number_e164.ilike.${q}`
      );
    } else {
      req = req.order('first_name', { ascending: true });
    }

    const { data, error } = await req;
    if (error) {
      console.error('Errore caricamento contatti:', error.message);
      setContacts([]);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, [businessId]);

  const handleSearch = () => fetchContacts(query);
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-black">Seleziona un Contatto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cerca per nome, email o telefono"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              <Search size={18} />
              Cerca
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Caricamento contatti...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun contatto disponibile.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contacts.map((contact, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    onSelect({
                      ...contact,
                      customer_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                    })
                  }
                  className="border border-gray-200 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-black">
                    {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                      'Nome non disponibile'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {contact.email || 'Email non disponibile'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {contact.phone_number_e164 || 'Telefono non disponibile'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPickerModal;