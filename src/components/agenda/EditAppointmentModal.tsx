import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const paymentMethods = ['Contanti', 'Carta', 'POS', 'Satispay', 'Altro'];

const EditAppointmentModal = ({
  appointment,
  onClose,
  onUpdated,
  initialTab = 'edit', // 👈 allow external control
}) => {
  const navigate = useNavigate();

  if (!appointment) return null;

  const [activeTab, setActiveTab] = useState<'edit' | 'payment'>(initialTab);

  const [customerName, setCustomerName] = useState(appointment.customer_name ?? '');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(appointment.service_id ?? '');
  const [duration, setDuration] = useState(appointment.duration_min ?? 0);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [appointmentDate, setAppointmentDate] = useState(
    appointment.appointment_date?.split('T')[0] ?? new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState(
    appointment.appointment_time?.slice(0, 5) ?? '08:00'
  );
  const [paymentMethod, setPaymentMethod] = useState(appointment.payment_method ?? '');

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration_min, price');
      if (error) {
        console.error('Errore caricamento servizi:', error.message);
        return;
      }
      setServices(data);
      const current = data.find((s) => s.id === appointment.service_id);
      if (current) {
        setPrice(current.price);
        setDuration(current.duration_min);
      }
    };

    fetchServices();
  }, [appointment.service_id]);

  const handleSave = async () => {
    const fullDateTime = `${appointmentDate}T${appointmentTime}:00`;

    if (activeTab === 'edit') {
      const { error } = await supabase
        .from('appointments')
        .update({
          customer_name: customerName,
          duration_min: duration,
          appointment_date: fullDateTime,
          appointment_time: appointmentTime,
          service_id: selectedServiceId,
        })
        .eq('uuid', appointment.uuid);

      if (error) {
        console.error('Errore durante la modifica:', error.message);
        return;
      }
    }

    if (activeTab === 'payment') {
      navigate('/cassa/nuova', {
        state: {
          appointment_id: appointment.uuid,
          customer_name,
          barber_id: appointment.barber_id,
          service_id: selectedServiceId,
          price,
          discount: 0,
          total: price,
          payment_method: '',
        },
      });
      return; // Let navigation handle the rest
    }

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

        {/* Title */}
        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'edit' ? 'Modifica Appuntamento' : 'Gestione Pagamento'}
        </h2>

        {/* Edit Form */}
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

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="mt-4">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-[#5D4037] text-white rounded hover:bg-[#4E342E] transition"
            >
              Vai alla pagina pagamento
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={activeTab === 'payment'} // avoid duplicate trigger
            className={`px-4 py-2 rounded text-white ${
              activeTab === 'payment'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
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