import React, { useState } from 'react';
import { Receipt, CreditCard, Banknote, Calendar, Search, FileText, Plus, ShoppingCart } from 'lucide-react';

// Mock appointments to be paid
const pendingAppointments = [
  { id: 101, date: '2025-05-09', time: '15:00', client: 'Chiara Blu', service: 'Taglio e shampoo', amount: 32, staff: 'Marco' },
  { id: 102, date: '2025-05-09', time: '16:30', client: 'Laura Verde', service: 'Trattamento viso', amount: 50, staff: 'Paolo' },
];

// Mock transactions already paid
const transactions = [
  { id: 1, date: '2025-05-09', time: '09:45', client: 'Giovanni Rossi', amount: 35, service: 'Taglio e barba', method: 'Carta' },
  { id: 2, date: '2025-05-09', time: '11:30', client: 'Luca Bianchi', amount: 25, service: 'Taglio classico', method: 'Contanti' },
];

const CassaPOSMockup = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = pendingAppointments.filter(
    appt =>
      appt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCard = transactions.filter(t => t.method === 'Carta').reduce((sum, t) => sum + t.amount, 0);
  const totalCash = transactions.filter(t => t.method === 'Contanti').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cassa</h1>
          <p className="text-gray-600">Gestisci transazioni e pagamenti</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E]">
          <Plus size={18} className="mr-1" />
          Nuova Transazione
        </button>
      </div>

      {/* Totals */}
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
          <p className="text-2xl font-semibold">€{totalCard}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Banknote size={20} className="text-yellow-600 mr-2" />
            <h3 className="text-gray-600">Pagamenti Contanti</h3>
          </div>
          <p className="text-2xl font-semibold">€{totalCash}</p>
        </div>
      </div>

      {/* Appuntamenti da incassare */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center">
            <ShoppingCart size={18} className="mr-2 text-[#5D4037]" /> Appuntamenti da Incassare
          </h2>
          <input
            type="text"
            placeholder="Cerca cliente o servizio"
            className="px-4 py-2 border rounded-md w-64 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ora</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servizio</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Totale</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-4 py-3 text-sm">{appt.time}</td>
                  <td className="px-4 py-3 text-sm font-medium">{appt.client}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appt.service}</td>
                  <td className="px-4 py-3 text-sm">{appt.staff}</td>
                  <td className="px-4 py-3 text-sm font-medium">€{appt.amount}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="bg-[#5D4037] text-white px-3 py-1 text-sm rounded hover:bg-[#4E342E]">Incassa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Qui potresti aggiungere la tabella delle transazioni già pagate come prima */}
    </div>
  );
};

export default CassaPOSMockup;