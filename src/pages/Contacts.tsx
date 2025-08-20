import React, { useEffect, useState, useCallback } from 'react';
import { User, Phone, Calendar, Clock, Search, Plus, Edit, X, Trash2 } from 'lucide-react'; // Added Trash2 back
import NewContactForm from '../components/rubrica/NewContactForm';
import EditContactModal from '../components/rubrica/EditContactModal';
import CreateAppointmentModal from '../components/agenda/CreateAppointmentModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';

const Contacts: React.FC = () => {
  const { profile, authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<null | string>(null);
  const [showCreateContactForm, setShowCreateContactForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  const fetchClients = useCallback(async (businessId: string) => {
    if (!businessId) return;

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone_number_e164, phone_prefix, phone_number_raw, birthdate, notes')
      .eq('business_id', businessId);

    if (error) {
      console.error('Errore nel caricamento dei contatti:', error);
      return;
    }

    const enriched = await Promise.all(
      (contacts || []).map(async (contact) => {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('appointment_date, service_id, services(name, duration_min)')
          .eq('contact_id', contact.id);

        const lastVisit = appointments?.length
          ? appointments.sort((a, b) =>
              new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
            )[0].appointment_date
          : null;

        const nextVisit = appointments?.find(
          (appt) => new Date(appt.appointment_date) > new Date()
        )?.appointment_date || null;

        const visitCount = appointments?.length || 0;

        return {
          id: contact.id,
          name: contact.first_name && contact.last_name 
            ? `${contact.first_name} ${contact.last_name}` 
            : contact.first_name || contact.last_name || 'Nome non disponibile',
          phone: contact.phone_number_e164,
          phone_prefix: contact.phone_prefix,
          phone_number_raw: contact.phone_number_raw,
          email: contact.email,
          birthdate: contact.birthdate,
          notes: contact.notes,
          lastVisit,
          visitCount,
          nextVisit,
        };
      })
    );

    setClients(enriched);
  }, []);

  useEffect(() => {
    if (profile?.business_id) {
      fetchClients(profile.business_id);
    }
  }, [fetchClients, profile?.business_id]);

  const filteredClients = clients.filter(
    client =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClientData = clients.find(client => client.id === selectedClient);

  const handleEditContact = () => {
    if (selectedClientData) {
      setEditingContact({
        id: selectedClientData.id,
        first_name: selectedClientData.name.split(' ')[0] || '',
        last_name: selectedClientData.name.split(' ').slice(1).join(' ') || '',
        email: selectedClientData.email,
        phone_prefix: selectedClientData.phone_prefix || '+39',
        phone_number_raw: selectedClientData.phone_number_raw || '',
        birthdate: selectedClientData.birthdate,
        notes: selectedClientData.notes,
      });
      setShowEditContactModal(true);
    }
  };

  const handleEditContactSave = () => {
    setShowEditContactModal(false);
    setEditingContact(null);
    fetchClients(profile.business_id);
  };

  if (authLoading || !profile?.business_id) {
    return <div className="p-6 text-gray-500">Caricamento contatti…</div>;
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Rubrica</h1>
          <p className="text-gray-600">Gestisci i contatti dei clienti</p>
        </div>
        <button
          onClick={() => setShowCreateContactForm(true)}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus size={18} className="mr-2" />
          Nuovo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca cliente"
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedClient === client.id ? 'bg-gray-50 border-l-4 border-black' : ''
                  }`}
                  onClick={() => {
                    setSelectedClient(client.id);
                    setShowCreateContactForm(false);
                  }}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                      {client.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-black">{client.name}</h3>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone size={12} className="mr-1" />
                        {client.phone}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">Nessun cliente trovato</div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {showCreateContactForm ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Nuovo Cliente</h2>
                <button
                  onClick={() => setShowCreateContactForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <NewContactForm 
                onCreated={() => {
                  setShowCreateContactForm(false);
                  fetchClients(profile.business_id);
                }} 
                onCancel={() => setShowCreateContactForm(false)}
              />
            </div>
          ) : selectedClientData ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-20 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
                    {selectedClientData.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-black">{selectedClientData.name}</h2>
                    <p className="text-gray-600 mt-1">Cliente Abituale</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleEditContact}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contatto</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{selectedClientData.phone}</span>
                    </div>
                    {selectedClientData.email && (
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-3">@</span>
                        <span className="text-black">{selectedClientData.email}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">Visite totali: {selectedClientData.visitCount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Dettagli</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">Ultima visita: {selectedClientData.lastVisit ? new Date(selectedClientData.lastVisit).toLocaleDateString('it-IT') : 'N/D'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-3" />
                      {selectedClientData.nextVisit ? (
                        <span className="text-black">Prossima visita: {new Date(selectedClientData.nextVisit).toLocaleDateString('it-IT')}</span>
                      ) : (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="text-sm text-black underline hover:text-gray-600 transition-colors font-medium"
                        >
                          Prenota ora →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Storico Appuntamenti</h3>
                <div className="text-gray-400 text-sm">(Integrazione futura)</div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500">
              <User size={48} className="mb-4" />
              <p>Seleziona un cliente per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchClients(profile.business_id)}
        />
      )}

      {showEditContactModal && (
        <EditContactModal
          isOpen={showEditContactModal}
          onClose={() => {
            setShowEditContactModal(false);
            setEditingContact(null);
          }}
          onSave={handleEditContactSave}
          defaultValues={editingContact}
        />
      )}
    </div>
  );
};

export default Contacts;