import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

const ContactPickerModal = ({ onSelect, onClose }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone_number_e164')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Errore caricamento contatti:', error.message);
        setContacts([]);
      } else {
        setContacts(data || []);
      }
      setLoading(false);
    };

    fetchContacts();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[70vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-black">Seleziona un Contatto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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
                  onClick={() => onSelect({
                    ...contact,
                    customer_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                  })}
                  className="border border-gray-200 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <p className="font-semibold text-black">
                    {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Nome non disponibile'}
                  </p>
                  <p className="text-sm text-gray-500">{contact.email || 'Email non disponibile'}</p>
                  <p className="text-sm text-gray-500">{contact.phone_number_e164 || 'Telefono non disponibile'}</p>
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