// src/components/agenda/ContactPickerModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ContactPickerModal = ({ onSelect, onClose }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('customer_name, customer_email, customer_phone')
        .order('customer_name', { ascending: true });

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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Seleziona un Contatto</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Chiudi</button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Caricamento...</p>
        ) : contacts.length === 0 ? (
          <p className="text-gray-500 text-sm">Nessun contatto disponibile.</p>
        ) : (
          <ul className="space-y-3 max-h-60 overflow-y-auto">
            {contacts.map((contact, idx) => (
              <li
                key={idx}
                onClick={() => onSelect(contact)}
                className="border p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-medium text-sm">{contact.customer_name}</p>
                <p className="text-xs text-gray-500">{contact.customer_email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ContactPickerModal;