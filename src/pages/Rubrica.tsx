import React, { useEffect, useState, useCallback } from 'react';
import { User, Phone, Calendar, Clock, Search, Plus, Edit, Trash2, Scissors } from 'lucide-react';
import SlidingPanelContact from '../components/rubrica/SlidingPanelContact';
import NewContactForm from '../components/rubrica/NewContactForm';
import { supabase } from '../lib/supabase';

const Rubrica: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<null | string>(null);
  const [showNewClientPanel, setShowNewClientPanel] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  // Extracted refresh function so we can reuse it
  const fetchClients = useCallback(async () => {
    const { data: contacts, error } = await supabase.from('contacts').select('*');
    if (error) {
      console.error('Errore nel caricamento dei contatti:', error);
      return;
    }

    const enriched = await Promise.all(
      (contacts || []).map(async (contact) => {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('appointment_date, service_id, services(name)')
          .eq('customer_id', contact.id);

        const lastVisit = appointments?.length
          ? appointments.sort((a, b) =>
              new Date(b.appointment_date).getTime() -
              new Date(a.appointment_date).getTime()
            )[0].appointment_date
          : null;

        const visitCount = appointments?.length || 0;

        const serviceFrequency = appointments?.reduce((acc, curr) => {
          const name = curr.services?.name;
          if (name) acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const favoriteService = serviceFrequency
          ? Object.entries(serviceFrequency).sort((a, b) => b[1] - a[1])[0][0]
          : null;

        return {
          id: contact.id,
          name: contact.customer_name,
          phone: contact.customer_phone,
          email: contact.customer_email,
          birthdate: contact.customer_birthdate,
          lastVisit,
          visitCount,
          favoriteService,
        };
      })
    );
    setClients(enriched);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(
    client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClientData = clients.find(client => client.id === selectedClient);

  return (
    <div className="h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rubrica</h1>
          <p className="text-gray-600">Gestisci i contatti dei clienti</p>
        </div>
        <button
          onClick={() => setShowNewClientPanel(true)}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Nuovo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca cliente"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedClient === client.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedClient(client.id)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium">{client.name}</h3>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Phone size={12} className="mr-1" />
                        {client.phone}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">Nessun cliente trovato</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedClientData ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-[#5D4037] text-white flex items-center justify-center text-xl font-medium">
                    {selectedClientData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedClientData.name}</h2>
                    <p className="text-gray-600 mt-1">Cliente Abituale</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contatto</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-2" />
                      <span>{selectedClientData.phone}</span>
                    </div>
                    {selectedClientData.email && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mr-2">
                          <path d="M4 4h16v12H4z" />
                          <path d="m22 6-10 7L2 6" />
                        </svg>
                        <span>{selectedClientData.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Dettagli</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span>Ultima visita: {selectedClientData.lastVisit ? new Date(selectedClientData.lastVisit).toLocaleDateString('it-IT') : 'N/D'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <span>Visite totali: {selectedClientData.visitCount}</span>
                    </div>
                    <div className="flex items-center">
                      <Scissors size={16} className="text-gray-400 mr-2" />
                      <span>Servizio preferito: {selectedClientData.favoriteService || 'N/D'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Storico Appuntamenti</h3>
                <div className="text-gray-400 text-sm">(Integrazione futura)</div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500">
              <User size={48} className="mb-2" />
              <p>Seleziona un cliente per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>

      {/* Sliding Panel */}
      <SlidingPanelContact
        visible={showNewClientPanel}
        onClose={() => setShowNewClientPanel(false)}
        onCreated={() => {
          setShowNewClientPanel(false);
          fetchClients(); // ⬅️ This line ensures newly added contact appears
        }}
      >
        <NewContactForm onCreated={() => {
          setShowNewClientPanel(false);
          fetchClients();
        }} />
      </SlidingPanelContact>
    </div>
  );
};

export default Rubrica;