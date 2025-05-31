import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase'; 
import { Calendar } from '../components/agenda/Calendar';
import CreateAppointmentModal from '../components/agenda/CreateAppointmentModal';
import AppointmentSummaryBanner from '../components/agenda/AppointmentSummaryBanner';
import SlidingPanelPayment from '../components/payment/SlidingPanelPayment';

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

const formatSquareDate = (date) =>
  date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
  }).toUpperCase();

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState({});
  const [viewMode, setViewMode] = useState('day');

  const timeSlots = generateTimeSlots();
  const dateInputRef = useRef(null);

  const fetchAppointments = async () => {
    const dates = getDatesInView(selectedDate, viewMode);
    const dateStrings = dates.map((d) => d.toISOString().split('T')[0]);
    const { data } = await supabase
      .from('appointments')
      .select(`*, services ( name, price )`)
      .in('appointment_date', dateStrings);
    setAppointments(data || []);
  };

  const fetchBarbers = async () => {
    const { data } = await supabase.from('barbers').select('*');
    setBarbers(data || []);
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewMode]);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const updateAppointmentTime = async (id, { newTime, newDate, newBarberId }) => {
    await supabase
      .from('appointments')
      .update({ appointment_time: newTime, appointment_date: newDate, barber_id: newBarberId })
      .eq('id', id);
    fetchAppointments();
  };

  const handlePay = () => {
    if (!selectedAppointment) return;
    const prefill = {
      appointment_id: selectedAppointment.id,
      barber_id: selectedAppointment.barber_id,
      service_id: selectedAppointment.service_id,
      price: selectedAppointment.services?.price || 0,
      customer_name: selectedAppointment.customer_name,
    };
    setPaymentPrefill(prefill);
    setShowPaymentPanel(true);
  };

  const today = new Date();
  const day1 = today;
  const day2 = new Date(today); day2.setDate(day2.getDate() + 1);
  const day3 = new Date(today); day3.setDate(day3.getDate() + 2);

  const dayButtons = [day1, day2, day3];

  const filtered = selectedBarber === 'Tutti'
    ? appointments.filter((app) =>
        app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : appointments.filter(
        (app) =>
          (app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
          app.barber_id === selectedBarber
      );

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
          <div className="flex items-center space-x-2">
            {dayButtons.map((date, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  selectedDate.toDateString() === date.toDateString()
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {formatSquareDate(date)}
              </button>
            ))}
            <button
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="p-2 border rounded-full hover:bg-gray-100"
            >
              <CalendarIcon size={18} />
            </button>
            <input
              type="date"
              ref={dateInputRef}
              className="hidden"
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
          onEdit={() => {}}
          onDelete={() => {}}
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