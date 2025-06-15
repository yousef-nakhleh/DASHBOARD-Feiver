// src/pages/Agenda.tsx
import {
  CalendarIcon,
  Plus,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { Calendar } from '../components/agenda/Calendar';
import CreateAppointmentModal from '../components/agenda/CreateAppointmentModal';
import AppointmentSummaryBanner from '../components/agenda/AppointmentSummaryBanner';
import EditAppointmentModal from '../components/agenda/EditAppointmentModal';
import SlidingPanelPayment from '../components/payment/SlidingPanelPayment';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BUSINESS_ID = '268e0ae9-c539-471c-b4c2-1663cf598436';

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const type = m === 0 ? 'hour' : m === 30 ? 'half' : 'quarter';
      slots.push({ time, type });
    }
  }
  return slots;
};

const getDatesInView = (baseDate, mode) => {
  const count = mode === 'day' ? 1 : mode === '3day' ? 3 : 7;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    return d;
  });
};

const formatShort = (d: Date) =>
  d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).toUpperCase();

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState({});
  const [viewMode, setViewMode] = useState<'day' | '3day' | 'week'>('day');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const timeSlots = generateTimeSlots();

  const fetchAppointments = async () => {
    const dates = getDatesInView(selectedDate, viewMode);
    const dateStrings = dates.map((d) => d.toISOString().split('T')[0]);
    const { data, error } = await supabase
      .from('appointments')
      .select(`*, services ( name, price )`)
      .eq('business_id', BUSINESS_ID)
      .in('appointment_date', dateStrings);
    if (error) console.error('Errore fetch appointments:', error.message);
    setAppointments(data || []);
  };

  const fetchBarbers = async () => {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('business_id', BUSINESS_ID);
    if (error) console.error('Errore fetch barbers:', error.message);
    setBarbers(data || []);
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewMode]);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const updateAppointmentTime = async (
    id: string,
    { newTime, newDate, newBarberId }
  ) => {
    await supabase
      .from('appointments')
      .update({ appointment_time: newTime, appointment_date: newDate, barber_id: newBarberId })
      .eq('id', id);
    fetchAppointments();
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    await supabase
      .from('appointments')
      .update({ appointment_status: 'cancellato' })
      .eq('id', selectedAppointment.id);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const handlePay = () => {
    if (!selectedAppointment) return;
    setPaymentPrefill({
      appointment_id: selectedAppointment.id,
      barber_id: selectedAppointment.barber_id,
      service_id: selectedAppointment.service_id,
      price: selectedAppointment.services?.price || 0,
      customer_name: selectedAppointment.customer_name,
    });
    setShowPaymentPanel(true);
  };

  const filtered =
    selectedBarber === 'Tutti'
      ? appointments.filter(
          (app) =>
            app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : appointments.filter(
          (app) =>
            (app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            app.barber_id === selectedBarber
        );

  const today = new Date();
  const dateButtons = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d;
  });

  return (
    <div className="h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-600">Gestisci gli appuntamenti del salone</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus size={18} className="mr-1" /> Nuovo Appuntamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 h-[700px] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {dateButtons.map((date, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded-full text-sm border ${
                  selectedDate.toDateString() === date.toDateString()
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                {formatShort(date)}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <CalendarIcon size={18} />
              </button>
              {showDatePicker && (
                <div className="absolute z-50 top-10">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date as Date);
                      setShowDatePicker(false);
                    }}
                    inline
                    locale="it"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cerca cliente o servizio"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2 px-4 pt-2">
          {['day', '3day', 'week'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-sm border ${
                viewMode === mode
                  ? 'bg-[#5D4037] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {mode === 'day' ? 'Giorno' : mode === '3day' ? '3 Giorni' : 'Settimana'}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto p-4 border-b border-gray-200">
          <button
            onClick={() => setSelectedBarber('Tutti')}
            className={`px-4 py-2 rounded-full text-sm border ${
              selectedBarber === 'Tutti'
                ? 'bg-[#5D4037] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tutti
          </button>
          {barbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => setSelectedBarber(barber.id)}
              className={`px-4 py-2 rounded-full text-sm border ${
                selectedBarber === barber.id
                  ? 'bg-[#5D4037] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {barber.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          <Calendar
            timeSlots={timeSlots}
            appointments={filtered}
            barbers={barbers || []}
            selectedBarber={selectedBarber}
            datesInView={getDatesInView(selectedDate, viewMode)}
            onDrop={updateAppointmentTime}
            onClickAppointment={(app) => setSelectedAppointment(app)}
          />
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentSummaryBanner
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onPay={handlePay}
          onEdit={() => setShowEditModal(true)}
          onDelete={handleDelete}
        />
      )}

      {showEditModal && selectedAppointment && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            setSelectedAppointment(null);
            fetchAppointments();
          }}
        />
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          selectedDate={selectedDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAppointments}
        />
      )}

      <SlidingPanelPayment
        visible={showPaymentPanel}
        prefill={paymentPrefill}
        onClose={() => setShowPaymentPanel(false)}
        onSuccess={() => {
          setShowPaymentPanel(false);
          fetchAppointments();
        }}
      />
    </div>
  );
};

export default Agenda;