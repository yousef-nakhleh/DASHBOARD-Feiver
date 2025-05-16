import React, { useState } from 'react';
import { Wallet, Plus, Calendar, DollarSign, Search, ChevronDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';

// Mock expenses data
const expenses = [
  { id: 1, date: '2025-05-01', category: 'Prodotti', amount: 350, description: 'Ordine shampoo e gel', vendor: 'BeautySupply', paymentMethod: 'Bonifico' },
  { id: 2, date: '2025-05-03', category: 'Utenze', amount: 120, description: 'Bolletta elettricità', vendor: 'EnergyCo', paymentMethod: 'Addebito' },
  { id: 3, date: '2025-05-05', category: 'Attrezzatura', amount: 85, description: 'Nuove forbici professionali', vendor: 'BarberTools', paymentMethod: 'Carta' },
  { id: 4, date: '2025-05-07', category: 'Marketing', amount: 200, description: 'Sponsorizzazione social', vendor: 'FacebookAds', paymentMethod: 'Carta' },
  { id: 5, date: '2025-04-28', category: 'Affitto', amount: 800, description: 'Affitto negozio - Maggio', vendor: 'Immobiliare XYZ', paymentMethod: 'Bonifico' },
  { id: 6, date: '2025-04-25', category: 'Pulizie', amount: 150, description: 'Servizio pulizia mensile', vendor: 'CleanPro', paymentMethod: 'Contanti' },
  { id: 7, date: '2025-04-20', category: 'Prodotti', amount: 210, description: 'Ordine tinte per capelli', vendor: 'ColorMaster', paymentMethod: 'Carta' },
  { id: 8, date: '2025-04-15', category: 'Manutenzione', amount: 75, description: 'Riparazione asciugacapelli', vendor: 'FixAll', paymentMethod: 'Contanti' },
];

// Get unique categories
const categories = [...new Set(expenses.map(e => e.category))];

// Group expenses by month
const groupExpensesByMonth = (expenses: any[]) => {
  return expenses.reduce((groups, expense) => {
    const date = new Date(expense.date);
    const month = date.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(expense);
    return groups;
  }, {});
};

const Spese: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Filter expenses based on search query, date and category
  const filteredExpenses = expenses.filter(
    expense => 
      (expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       expense.vendor.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (dateFilter ? expense.date === dateFilter : true) &&
      (categoryFilter ? expense.category === categoryFilter : true)
  );

  // Group filtered expenses by month
  const groupedExpenses = groupExpensesByMonth(filteredExpenses);

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Spese</h1>
          <p className="text-gray-600">Gestisci le spese del salone</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuova Spesa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Wallet size={20} className="text-blue-600 mr-2" />
            <h3 className="text-gray-600">Spese Totali</h3>
          </div>
          <p className="text-2xl font-semibold">€{totalExpenses}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <ArrowUp size={20} className="text-red-600 mr-2" />
            <h3 className="text-gray-600">Categoria Principale</h3>
          </div>
          <p className="text-2xl font-semibold">Prodotti</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <ArrowDown size={20} className="text-green-600 mr-2" />
            <h3 className="text-gray-600">Rispetto al Mese Scorso</h3>
          </div>
          <p className="text-2xl font-semibold">-5%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca descrizione o fornitore"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center">
                <Calendar size={18} className="text-gray-400 mr-2" />
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] bg-white"
                  value={categoryFilter || ''}
                  onChange={(e) => setCategoryFilter(e.target.value === '' ? null : e.target.value)}
                >
                  <option value="">Tutte le categorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {Object.keys(groupedExpenses).length > 0 ? (
            Object.entries(groupedExpenses).map(([month, exps]) => (
              <div key={month} className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3 capitalize">
                  {month}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrizione</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornitore</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(exps as any[]).map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {new Date(expense.date).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{expense.description}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{expense.vendor}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">€{expense.amount}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{expense.paymentMethod}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-800">
                              <FileText size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nessuna spesa trovata
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Spese;