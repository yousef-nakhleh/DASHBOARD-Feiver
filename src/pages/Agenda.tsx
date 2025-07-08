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

  const [slotPrefill, setSlotPrefill] = useState<{
    date: string;
    time: string;
    barberId: string;
  } | null>(null);

  const timeSlots = generateTimeSlots();

  const fetchAppointments = async () => {
    const dates = getDatesInView(selectedDate, viewMode);
    const dateStrings = dates.map((d) => d.toISOString().split('T')[0]);
    const { data, error } = await supabase
      .from('appointments')
      .select(`*, services ( name, price )`)
      .eq('business_id', BUSINESS_ID)
      .in('appointment_date', dateStrings)
      .in('appointment_status', ['pending', 'confirmed']); // ✅ ONLY change
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
      .update({ appointment_status: 'cancelled' })
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

  const dateButtons = [0, 1, 2].map((offset) => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() + offset);
    return d;
  });

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Agenda</h1>
          <p className="text-gray-600">Gestisci gli appuntamenti del salone</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus size={18} className="mr-2" /> Nuovo Appuntamento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {dateButtons.map((date, i) => (
              <button
                key={i}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedDate.toDateString() === date.toDateString()
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                {formatShort(date)}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
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
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2 px-6 pt-4">
          {['day', '3day', 'week'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'day' ? 'Giorno' : mode === '3day' ? '3 Giorni' : 'Settimana'}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto p-6 border-b border-gray-100">
          <button
            onClick={() => setSelectedBarber('Tutti')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              selectedBarber === 'Tutti'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti
          </button>
          {barbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => setSelectedBarber(barber.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedBarber === barber.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            onEmptySlotClick={(barberId, date, time) => {
              setSlotPrefill({ barberId, date, time });
              setShowCreateModal(true);
            }}
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
          initialBarberId={slotPrefill?.barberId || ''}
          initialDate={slotPrefill?.date || selectedDate.toISOString().split('T')[0]}
          initialTime={slotPrefill?.time || '07:00'}
          onClose={() => {
            setShowCreateModal(false);
            setSlotPrefill(null);
          }}
          onCreated={() => {
            setShowCreateModal(false);
            setSlotPrefill(null);
            fetchAppointments();
          }}
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