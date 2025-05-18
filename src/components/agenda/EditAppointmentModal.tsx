import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const paymentMethods = ['Contanti', 'Carta', 'POS', 'Satispay', 'Altro'];

const EditAppointmentModal = ({ appointment, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'payment'>('payment');

  const [customerName, setCustomerName] = useState(appointment.customer_name);
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState(appointment.duration_min);

  const [paid, setPaid] = useState(appointment.paid || false);
  const [paymentMethod, setPaymentMethod] = useState(appointment.payment_method || '');

  useEffect(() => {
    // Fetch service name by ID
    const fetchServiceName = async () => {
      const { data } = await supabase
        .from('services')
        .select('name')
        .eq('id', appointment.service_id)
        .single();
      setServiceName(data?.name || '');
    };

    fetchServiceName();
  }, [appointment.service_id]);

  const handleSave = async () => {
    await supabase
      .from('appointments')
      .update({
        customer_name: customerName,
        duration_min: duration,
        paid,
        payment_method: paid ? paymentMethod : null,
      })
      .eq('id', appointment.id);

    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
        {/* Tab Switcher */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1 text-sm rounded-full ${
              activeTab === 'edit' ? 'bg-[#5D4037] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Modifica
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1 text-sm rounded-full ${
              activeTab === 'payment' ? 'bg-[#5D4037] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pagamento
          </button>
        </div>

        {/* Modal Title */}
        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'edit' ? 'Modifica Appuntamento' : 'Gestione Pagamento'}
        </h2>

        {/* Edit Section */}
        {activeTab === 'edit' && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Cliente</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Servizio</label>
              <input
                type="text"
                value={serviceName}
                disabled
                className="w-full mt-1 border border-gray-200 bg-gray-50 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Durata (minuti)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* Payment Section */}
        {activeTab === 'payment' && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pagato</label>
              <select
                value={paid ? 'true' : 'false'}
                onChange={(e) => setPaid(e.target.value === 'true')}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              >
                <option value="false">No</option>
                <option value="true">Sì</option>
              </select>
            </div>

            {paid && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Metodo di pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Seleziona metodo</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;