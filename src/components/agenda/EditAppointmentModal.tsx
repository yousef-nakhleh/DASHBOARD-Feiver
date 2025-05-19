import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CreateAppointmentModal = ({ selectedDate, onClose, onCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [time, setTime] = useState('07:00');
  const [duration, setDuration] = useState(30);
  const [appointmentDate, setAppointmentDate] = useState(
    selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
  );

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from('services').select('*');
      setServices(data || []);
    };

    const fetchBarbers = async () => {
      const { data } = await supabase.from('barbers').select('*');
      setBarbers(data || []);
    };

    fetchServices();
    fetchBarbers();
  }, []);

  useEffect(() => {
    const selectedService = services.find((s) => s.id === serviceId);
    if (selectedService) {
      setDuration(selectedService.duration_min);
    }
  }, [serviceId]);

  const handleCreate = async () => {
    await supabase.from('appointments').insert([
      {
        customer_name: customerName,
        service_id: serviceId,
        barber_id: barberId,
        appointment_time: time,
        appointment_date: appointmentDate,
        duration_min: duration,
      },
    ]);

    onCreated();
    onClose();
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
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleziona servizio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Barbiere</label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleziona barbiere</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
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
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              {Array.from({ length: 60 }, (_, i) => {
                const h = String(Math.floor(i / 4) + 6).padStart(2, '0');
                const m = String((i % 4) * 15).padStart(2, '0');
                return (
                  <option key={i} value={`${h}:${m}`}>
                    {h}:{m}
                  </option>
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
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Crea
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;