import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const paymentMethods = ['Contanti', 'Carta', 'POS', 'Satispay', 'Altro'];

const EditAppointmentModal = ({ appointment, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'payment'>('payment');

  const [customerName, setCustomerName] = useState(appointment.customer_name);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(appointment.service_id);
  const [duration, setDuration] = useState(appointment.duration_min);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [appointmentDate, setAppointmentDate] = useState(
    appointment.appointment_date?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState(
    appointment.appointment_date?.split('T')[1]?.slice(0, 5) || '08:00'
  );

  const [paymentMethod, setPaymentMethod] = useState(appointment.payment_method || '');

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from('services').select('id, name, duration_min, price');
      if (data) {
        setServices(data);
        const current = data.find((s) => s.id === appointment.service_id);
        if (current) {
          setPrice(current.price);
          setDuration(current.duration_min);
        }
      }
    };

    fetchServices();
  }, [appointment.service_id]);

  const handleSave = async () => {
    const fullDateTime = `${appointmentDate}T${appointmentTime}:00`;

    if (activeTab === 'edit') {
      await supabase
        .from('appointments')
        .update({
          customer_name: customerName,
          duration_min: duration,
          appointment_date: fullDateTime,
          service_id: selectedServiceId,
        })
        .eq('id', appointment.id);
    }

    if (activeTab === 'payment') {
      const total = price - discount;

      await supabase
        .from('appointments')
        .update({
          paid: true,
          payment_method: paymentMethod,
        })
        .eq('id', appointment.id);

      await supabase.from('transactions').insert([
        {
          appointment_id: appointment.id,
          barber_id: appointment.barber_id,
          service_id: selectedServiceId,
          price,
          discount,
          total,
          payment_method: paymentMethod,
          completed_at: new Date().toISOString(),
        },
      ]);
    }

    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
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

        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'edit' ? 'Modifica Appuntamento' : 'Gestione Pagamento'}
        </h2>

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
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  const selected = services.find((s) => s.id === e.target.value);
                  setSelectedServiceId(e.target.value);
                  if (selected) {
                    setPrice(selected.price);
                    setDuration(selected.duration_min);
                  }
                }}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Seleziona servizio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Orario</label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
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

        {activeTab === 'payment' && (
          <div className="space-y-4 mt-2">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Prezzo</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sconto</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Totale</label>
              <input
                type="text"
                value={`€ ${price - discount}`}
                disabled
                className="w-full mt-1 border border-gray-200 bg-gray-50 rounded px-3 py-2 text-gray-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={appointment.paid}
            className={`px-4 py-2 rounded text-white ${
              appointment.paid ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;