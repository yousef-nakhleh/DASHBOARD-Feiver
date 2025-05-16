import React, { useState } from 'react';
import { User, Phone, Calendar, Clock, Search, Plus, Edit, Trash2 } from 'lucide-react';

// Mock client data
const clients = [
  { id: 1, name: 'Giovanni Rossi', phone: '333-1234567', email: 'giovanni.rossi@email.it', lastVisit: '2025-05-01', visitCount: 8, favoriteService: 'Taglio e barba' },
  { id: 2, name: 'Luca Bianchi', phone: '333-7654321', email: 'luca.bianchi@email.it', lastVisit: '2025-05-03', visitCount: 5, favoriteService: 'Taglio classico' },
  { id: 3, name: 'Andrea Verdi', phone: '333-9876543', email: 'andrea.verdi@email.it', lastVisit: '2025-05-07', visitCount: 3, favoriteService: 'Rasatura completa' },
  { id: 4, name: 'Marco Neri', phone: '333-3456789', email: 'marco.neri@email.it', lastVisit: '2025-04-28', visitCount: 12, favoriteService: 'Taglio e trattamento' },
  { id: 5, name: 'Fabio Gialli', phone: '333-6543210', email: 'fabio.gialli@email.it', lastVisit: '2025-04-15', visitCount: 2, favoriteService: 'Shampoo e taglio' },
  { id: 6, name: 'Simone Azzurri', phone: '333-2345678', email: 'simone.azzurri@email.it', lastVisit: '2025-03-20', visitCount: 1, favoriteService: 'Taglio prima volta' },
  { id: 7, name: 'Roberto Marroni', phone: '333-8765432', email: 'roberto.marroni@email.it', lastVisit: '2025-05-08', visitCount: 7, favoriteService: 'Taglio e barba' },
  { id: 8, name: 'Alessandro Viola', phone: '333-5432109', email: 'alessandro.viola@email.it', lastVisit: '2025-05-05', visitCount: 4, favoriteService: 'Rasatura semplice' },
];

const Rubrica: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<null | number>(null);

  // Filter clients based on search query
  const filteredClients = clients.filter(
    client => client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              client.phone.includes(searchQuery) ||
              client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClientData = clients.find(client => client.id === selectedClient);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rubrica</h1>
          <p className="text-gray-600">Gestisci i contatti dei clienti</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuovo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client list */}
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
              <div className="p-4 text-center text-gray-500">
                Nessun cliente trovato
              </div>
            )}
          </div>
        </div>

        {/* Client details */}
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
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Informazioni di Contatto</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-2" />
                      <span>{selectedClientData.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span>{selectedClientData.email}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Dettagli Cliente</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span>Ultima visita: {new Date(selectedClientData.lastVisit).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <span>Visite totali: {selectedClientData.visitCount}</span>
                    </div>
                    <div className="flex items-center">
                      <Scissors size={16} className="text-gray-400 mr-2" />
                      <span>Servizio preferito: {selectedClientData.favoriteService}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Storico Appuntamenti</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servizio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barbiere</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">07/05/2025</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">Taglio e barba</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">Marco</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">€35</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">21/04/2025</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">Taglio capelli</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">Paolo</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">€25</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">05/04/2025</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">Rasatura completa</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">Marco</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">€20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
    </div>
  );
};

export default Rubrica;