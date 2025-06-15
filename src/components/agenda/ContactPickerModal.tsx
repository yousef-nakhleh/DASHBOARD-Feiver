import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ContactPickerModalProps {
  onSelect: (fullName: string) => void;
  onClose: () => void;
}

const ContactPickerModal: React.FC<ContactPickerModalProps> = ({ onSelect, onClose }) => {
  const [contacts, setContacts] = useState<{ full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('full_name')
        .order('full_name', { ascending: true });

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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-5 w-[360px] max-h-[500px] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Seleziona un Contatto</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Caricamento contatti...</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-gray-500">Nessun contatto disponibile.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li
                key={contact.full_name}
                onClick={() => onSelect(contact.full_name)}
                className="cursor-pointer px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-800"
              >
                {contact.full_name}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactPickerModal;