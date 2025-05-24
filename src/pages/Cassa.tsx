import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Receipt,
  CreditCard,
  Banknote,
  Calendar,
  Search,
  FileText,
  Plus,
} from 'lucide-react';

const Cassa = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, service:service_id(name), barber:barber_id(name), appointment:appointment_id(client_name, completed_at)`) // Adjust if relationships differ
        .order('completed_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((tx) => {
          const date = new Date(tx.completed_at);
          return {
            id: tx.id,
            date: date.toISOString().split('T')[0],
            time: date.toTimeString().substring(0, 5),
            client: tx.appointment?.client_name || 'Sconosciuto',
            service: tx.service?.name || 'Servizio',
            method: tx.payment_method || 'N/D',
            amount: tx.total,
          };
        });
        setTransactions(mapped);
      }
    };
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(
    (tx) =>
      (tx.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.service.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!dateFilter || tx.date === dateFilter)
  );

  const grouped = filtered.reduce((acc, tx) => {
    acc[tx.date] = acc[tx.date] || [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  const card = filtered.filter((tx) => tx.method === 'Carta').reduce((sum, tx) => sum + tx.amount, 0);
  const cash = filtered.filter((tx) => tx.method === 'Contanti').reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cassa</h1>
          <p className="text-gray-600">Gestisci transazioni e pagamenti</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" /> Nuova Transazione
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Receipt size={20} className="text-blue-600 mr-2" />
            <h3 className="text-gray-600">Incasso Totale</h3>
          </div>
          <p className="text-2xl font-semibold">€{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <CreditCard size={20} className="text-green-600 mr-2" />
            <h3 className="text-gray-600">Pagamenti Carta</h3>
          </div>
          <p className="text-2xl font-semibold">€{card}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Banknote size={20} className="text-yellow-600 mr-2" />
            <h3 className="text-gray-600">Pagamenti Contanti</h3>
          </div>
          <p className="text-2xl font-semibold">€{cash}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca cliente o servizio"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <Calendar size={18} className="text-gray-400 mr-2" />
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          {Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([date, txs]) => (
              <div key={date} className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  {new Date(date).toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ora</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servizio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metodo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(txs).map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{tx.time}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{tx.client}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{tx.service}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">€{tx.amount}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tx.method === 'Carta'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tx.method}
                            </span>
                          </td>
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
            <div className="text-center py-8 text-gray-500">Nessuna transazione trovata</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cassa;