import React, { useState } from 'react';
import { Tag, Calendar, Search, Plus, Edit, Trash2, Copy, Check } from 'lucide-react';

// Mock promotions data
const promotions = [
  { 
    id: 1, 
    name: 'Sconto Studenti', 
    description: 'Sconto del 15% per tutti gli studenti con tessera universitaria', 
    discount: 15, 
    type: 'Percentuale', 
    startDate: '2025-05-01', 
    endDate: '2025-06-30', 
    services: ['Taglio Capelli', 'Taglio e Barba'],
    usageCount: 24,
    status: 'active',
    code: 'STUDENTE15'
  },
  { 
    id: 2, 
    name: 'Pacchetto Famiglia', 
    description: 'Sconto speciale per padri e figli che prenotano insieme', 
    discount: 10, 
    type: 'Percentuale', 
    startDate: '2025-04-15', 
    endDate: '2025-07-15', 
    services: ['Taglio Capelli', 'Taglio Bambino'],
    usageCount: 8,
    status: 'active',
    code: 'FAMIGLIA10'
  },
  { 
    id: 3, 
    name: 'Sconto Prima Visita', 
    description: 'Sconto di €5 sul primo appuntamento', 
    discount: 5, 
    type: 'Fisso', 
    startDate: '2025-01-01', 
    endDate: '2025-12-31', 
    services: ['Tutti i servizi'],
    usageCount: 42,
    status: 'active',
    code: 'NUOVO5'
  },
  { 
    id: 4, 
    name: 'Happy Hour Mattina', 
    description: 'Sconto del 20% per appuntamenti prima delle 11:00', 
    discount: 20, 
    type: 'Percentuale', 
    startDate: '2025-05-01', 
    endDate: '2025-06-15', 
    services: ['Tutti i servizi'],
    usageCount: 15,
    status: 'active',
    code: 'MATTINA20'
  },
  { 
    id: 5, 
    name: 'Promo Estate', 
    description: 'Pacchetto speciale estate con shampoo omaggio', 
    discount: 10, 
    type: 'Percentuale', 
    startDate: '2025-06-01', 
    endDate: '2025-08-31', 
    services: ['Taglio Capelli', 'Taglio e Barba', 'Shampoo e Taglio'],
    usageCount: 0,
    status: 'scheduled',
    code: 'ESTATE10'
  },
  { 
    id: 6, 
    name: 'Black Friday', 
    description: 'Sconto speciale del 25% per il Black Friday', 
    discount: 25, 
    type: 'Percentuale', 
    startDate: '2024-11-27', 
    endDate: '2024-11-30', 
    services: ['Tutti i servizi'],
    usageCount: 36,
    status: 'expired',
    code: 'BLACK25'
  },
];

const Promozioni: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter promotions based on search query and status
  const filteredPromotions = promotions.filter(
    promo => 
      (promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       promo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       promo.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter ? promo.status === statusFilter : true)
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusText = (status: string) => {
    if (status === 'active') return 'Attiva';
    if (status === 'scheduled') return 'Programmata';
    if (status === 'expired') return 'Scaduta';
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'scheduled') return 'bg-blue-100 text-blue-800';
    if (status === 'expired') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promozioni</h1>
          <p className="text-gray-600">Gestisci offerte e sconti</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuova Promozione
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca promozione"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === null
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter(null)}
              >
                Tutte
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'active'
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter('active')}
              >
                Attive
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'scheduled'
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter('scheduled')}
              >
                Programmate
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'expired'
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter('expired')}
              >
                Scadute
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredPromotions.length > 0 ? (
            filteredPromotions.map((promo) => (
              <div key={promo.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
                <div className={`p-3 ${promo.status === 'active' ? 'bg-green-50' : promo.status === 'scheduled' ? 'bg-blue-50' : 'bg-gray-50'} border-b`}>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(promo.status)}`}>
                      {getStatusText(promo.status)}
                    </span>
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-2">{promo.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{promo.description}</p>
                  
                  <div className="flex items-center mb-3">
                    <Tag size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium">
                      {promo.type === 'Percentuale' ? `${promo.discount}%` : `€${promo.discount}`} di sconto
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm">
                      {new Date(promo.startDate).toLocaleDateString('it-IT')} - {new Date(promo.endDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 mr-2">
                        <div className="p-2 bg-gray-100 rounded flex items-center justify-between">
                          <code className="text-sm font-mono">{promo.code}</code>
                          <button 
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() => handleCopyCode(promo.code)}
                          >
                            {copiedCode === promo.code ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Utilizzi</span>
                        <p className="text-md font-medium">{promo.usageCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              Nessuna promozione trovata
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Promozioni;