import React, { useState } from 'react';
import { Scissors, Clock, DollarSign, Plus, Edit, Search, Trash2 } from 'lucide-react';

// Mock treatments data    
const treatments = [
  { id: 1, name: 'Taglio Capelli', duration: 30, price: 25, description: 'Taglio classico con rifinitura', category: 'Capelli', popular: true },
  { id: 2, name: 'Barba', duration: 20, price: 15, description: 'Rasatura e rifinitura barba', category: 'Barba', popular: true },
  { id: 3, name: 'Taglio e Barba', duration: 45, price: 35, description: 'Combinazione di taglio capelli e barba', category: 'Combo', popular: true },
  { id: 4, name: 'Shampoo e Taglio', duration: 40, price: 30, description: 'Shampoo, massaggio al cuoio capelluto e taglio', category: 'Capelli', popular: false },
  { id: 5, name: 'Rasatura Completa', duration: 25, price: 20, description: 'Rasatura completa con panno caldo', category: 'Barba', popular: false },
  { id: 6, name: 'Taglio Bambino', duration: 20, price: 20, description: 'Taglio specifico per bambini fino a 12 anni', category: 'Capelli', popular: false },
  { id: 7, name: 'Tinta Capelli', duration: 60, price: 40, description: 'Applicazione colore e ritocco', category: 'Colore', popular: false },
  { id: 8, name: 'Trattamento Capelli', duration: 30, price: 25, description: 'Trattamento nutriente per capelli', category: 'Trattamenti', popular: false },
];

const categories = [...new Set(treatments.map(t => t.category))];

const Trattamenti: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter treatments based on search query and category
  const filteredTreatments = treatments.filter(
    treatment => 
      treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory ? treatment.category === selectedCategory : true)
  );

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trattamenti</h1>
          <p className="text-gray-600">Gestisci servizi e prezzi</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuovo Trattamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca trattamento"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === null
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                Tutti
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category
                      ? 'bg-[#5D4037] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trattamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durata
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prezzo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Popolare
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTreatments.map((treatment) => (
                <tr key={treatment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{treatment.name}</div>
                        <div className="text-sm text-gray-500">{treatment.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{treatment.duration} min</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign size={16} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">€{treatment.price}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {treatment.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {treatment.popular ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Sì
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trattamenti;