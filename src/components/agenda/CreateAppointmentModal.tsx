// CreateAppointmentModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CreateAppointmentModal = ({ onClose, onCreated, defaultDate }) => {
  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: serviceData } = await supabase.from('services').select('*');
      const { data: barberData } = await supabase.from('barbers').select('*');
      setServices(serviceData || []);
      setBarbers(barberData || []);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const service = services.find(s => s.id === selectedServiceId);
    if (service) setDuration(service.duration_min);
  }, [selectedServiceId, services]);

  const handleSubmit = async () => {
    if (!defaultDate) return alert("Missing selected date");

    const { error } = await supabase.from('appointments').insert({
      customer_name: customerName,
      service_id: selectedServiceId,
      barber_id: selectedBarberId,
      appointment_date: defaultDate.toISOString().split('T')[0],
      appointment_time: selectedTime,
      duration_min: duration,
    });

    if (!error) {
      onCreated();
      onClose();
    } else {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Nuovo Appuntamento</h2>
        <div className="space-y-4">
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
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleziona servizio</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Barbiere</label>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleziona barbiere</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Orario</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              {[...Array(16)].map((_, i) => {
                const hour = String(7 + Math.floor(i / 4)).padStart(2, '0');
                const minutes = String((i % 4) * 15).padStart(2, '0');
                return (
                  <option key={i} value={`${hour}:${minutes}`}>{`${hour}:${minutes}`}</option>
                );
              })}
            </select>
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

        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">
            Annulla
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            Crea
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;