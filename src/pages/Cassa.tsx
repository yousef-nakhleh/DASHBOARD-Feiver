import React, { useState } from 'react';
import {
  Receipt,
  CreditCard,
  Banknote,
  Calendar,
  Search,
  FileText,
  Plus,
  ShoppingCart,
  Trash
} from 'lucide-react';

const pendingAppointments = [
  { id: 101, date: '2025-05-09', time: '15:00', client: 'Chiara Blu', service: 'Taglio e shampoo', amount: 32, staff: 'Marco' },
  { id: 102, date: '2025-05-09', time: '16:30', client: 'Laura Verde', service: 'Trattamento viso', amount: 50, staff: 'Paolo' },
];

const transactions = [
  { id: 1, date: '2025-05-09', time: '09:45', client: 'Giovanni Rossi', amount: 35, service: 'Taglio e barba', method: 'Carta' },
  { id: 2, date: '2025-05-09', time: '11:30', client: 'Luca Bianchi', amount: 25, service: 'Taglio classico', method: 'Contanti' },
];

const CassaPOSMockup = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualItems, setManualItems] = useState([{ type: 'Servizio', name: '', price: 0 }]);
  const [manualPaymentMethod, setManualPaymentMethod] = useState('');
  const [manualClient, setManualClient] = useState('');

  const filteredAppointments = pendingAppointments.filter(
    appt =>
      appt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCard = transactions.filter(t => t.method === 'Carta').reduce((sum, t) => sum + t.amount, 0);
  const totalCash = transactions.filter(t => t.method === 'Contanti').reduce((sum, t) => sum + t.amount, 0);
  const manualTotal = manualItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

  const updateManualItem = (index, field, value) => {
    const items = [...manualItems];
    items[index][field] = value;
    setManualItems(items);
  };

  const addManualItem = () => {
    setManualItems([...manualItems, { type: 'Servizio', name: '', price: 0 }]);
  };

  const removeManualItem = (index) => {
    const items = manualItems.filter((_, i) => i !== index);
    setManualItems(items);
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cassa</h1>
          <p className="text-gray-600">Gestisci transazioni e pagamenti</p>
        </div>
        <button
          onClick={() => setShowManual(true)}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E]"
        >
          <Plus size={18} className="mr-1" />
          Nuova Transazione
        </button>
      </div>

      {/* Totali */}
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

      {/* Modal manuale */}
      {showManual && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Nuova Transazione Manuale</h2>

            <input
              type="text"
              placeholder="Nome cliente (facoltativo)"
              className="border p-2 rounded w-full mb-4"
              value={manualClient}
              onChange={(e) => setManualClient(e.target.value)}
            />

            {manualItems.map((item, i) => (
              <div key={i} className="flex items-center mb-2 gap-2">
                <select
                  value={item.type}
                  onChange={(e) => updateManualItem(i, 'type', e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="Servizio">Servizio</option>
                  <option value="Prodotto">Prodotto</option>
                  <option value="Buono">Buono Regalo</option>
                </select>
                <input
                  type="text"
                  placeholder="Nome"
                  className="border p-2 rounded w-1/2"
                  value={item.name}
                  onChange={(e) => updateManualItem(i, 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Prezzo"
                  className="border p-2 rounded w-1/4"
                  value={item.price}
                  onChange={(e) => updateManualItem(i, 'price', e.target.value)}
                />
                <button onClick={() => removeManualItem(i)} className="text-red-500"><Trash size={16} /></button>
              </div>
            ))}

            <button onClick={addManualItem} className="text-sm text-[#5D4037] underline mb-4">+ Aggiungi voce</button>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Metodo di pagamento</label>
              <select
                value={manualPaymentMethod}
                onChange={(e) => setManualPaymentMethod(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="">Seleziona...</option>
                <option value="Carta">Carta</option>
                <option value="Contanti">Contanti</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold">Totale: €{manualTotal.toFixed(2)}</span>
              <div className="flex gap-2">
                <button onClick={() => setShowManual(false)} className="px-4 py-2 border rounded">Annulla</button>
                <button className="px-4 py-2 bg-[#5D4037] text-white rounded">Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CassaPOSMockup;