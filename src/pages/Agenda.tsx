// src/pages/Agenda.tsx
import {
  CalendarIcon,
  Plus,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDateToYYYYMMDDLocal } from '../lib/utils';
import { toUTCFromLocal } from '../lib/timeUtils';

import { Calendar } from '../components/agenda/Calendar';
import CreateAppointmentModal from '../components/agenda/CreateAppointmentModal';
import AppointmentSummaryBanner from '../components/agenda/AppointmentSummaryBanner';
import SlidingPanelPayment from '../components/payment/SlidingPanelPayment';
import Dropdown from '../components/ui/Dropdown';
import AvailabilityExceptionFormModal from '../components/staff/AvailabilityExceptionFormModal';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// 🔐 Auth
import { useAuth } from '../components/auth/AuthContext';
import { useSelectedBusiness } from '../components/auth/SelectedBusinessProvider'; // ✅ NEW import

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 10) { // 🔄 10-minute grid
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
  const { profile, loading: authLoading } = useAuth();
  const { effectiveBusinessId } = useSelectedBusiness(); // ✅ use business from provider

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [businessTimezone, setBusinessTimezone] = useState('Europe/Rome');
  const [selectedBarber, setSelectedBarber] = useState<string>('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [showHeaderExceptionModal, setShowHeaderExceptionModal] = useState(false);
  const [headerExceptionType, setHeaderExceptionType] = useState<'open' | 'closed'>('closed');
  const [paymentPrefill, setPaymentPrefill] = useState({});
  const [viewMode, setViewMode] = useState<'day' | '3day' | 'week'>('day');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [slotPrefill, setSlotPrefill] = useState<{
    date: string;
    time: string;
    barberId: string;
  } | null>(null);

  const timeSlots = generateTimeSlots();

  // Fetch business timezone
  useEffect(() => {
    const fetchBusinessTimezone = async () => {
      if (authLoading) return;
      if (!effectiveBusinessId) return;

      const { data, error } = await supabase
        .from('business')
        .select('timezone')
        .eq('id', effectiveBusinessId)
        .single();

      if (!error && data?.timezone) {
        setBusinessTimezone(data.timezone);
      }
    };
    fetchBusinessTimezone();
  }, [authLoading, effectiveBusinessId]);

  const fetchAppointments = async () => {
    if (typeof effectiveBusinessId !== 'string' || !effectiveBusinessId) {
      console.log("Skipping fetchAppointments: Invalid business_id type or value", effectiveBusinessId);
      return;
    }
    if (!effectiveBusinessId) return;

    const dates = getDatesInView(selectedDate, viewMode);

    // UTC range
    const startOfFirstDay = toUTCFromLocal({
      date: formatDateToYYYYMMDDLocal(dates[0]),
      time: '00:00',
      timezone: businessTimezone,
    });
    const endOfLastDay = toUTCFromLocal({
      date: formatDateToYYYYMMDDLocal(dates[dates.length - 1]),
      time: '23:59',
      timezone: businessTimezone,
    });

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        contact:contact_id ( first_name, last_name, phone_number_e164 ),  
        barber_id,
        service_id,
        appointment_status,
        paid,
        duration_min,
        services ( name, price, duration_min )
      `)
      .eq('business_id', effectiveBusinessId)
      .gte('appointment_date', startOfFirstDay)
      .lte('appointment_date', endOfLastDay)
      .in('appointment_status', ['pending', 'confirmed']);

    if (error) console.error('Errore fetch appointments:', error.message);
    setAppointments(data || []);
  };

  const fetchBarbers = async () => {
    if (!effectiveBusinessId) return;

    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('business_id', effectiveBusinessId);

    if (error) console.error('Errore fetch barbers:', error.message);
    setBarbers(data || []);
  };

  useEffect(() => {
    if (authLoading) return;
    fetchAppointments();
  }, [selectedDate, viewMode, businessTimezone, authLoading, effectiveBusinessId]);

  useEffect(() => {
    if (authLoading) return;
    fetchBarbers();
  }, [authLoading, effectiveBusinessId]);

  // Realtime
  useEffect(() => {
    if (authLoading || !effectiveBusinessId) return;

    const channel = supabase
      .channel(`appointments-realtime-${effectiveBusinessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${effectiveBusinessId}`,
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, effectiveBusinessId]);

  const handleExceptionSelect = (value: string) => {
    if (value === 'apertura') {
      setHeaderExceptionType('open');
      setShowHeaderExceptionModal(true);
    } else if (value === 'chiusura') {
      setHeaderExceptionType('closed');
      setShowHeaderExceptionModal(true);
    }
  };

  const handleExceptionModalClose = () => {
    setShowHeaderExceptionModal(false);
  };

  const handleExceptionModalSave = () => {
    setShowHeaderExceptionModal(false);
    fetchAppointments();
  };

  const updateAppointmentTime = async (
    id: string,
    { newTime, newDate, newBarberId }: { newTime: string; newDate: string; newBarberId: string }
  ) => {
    const newAppointmentStart = toUTCFromLocal({
      date: newDate,
      time: newTime,
      timezone: businessTimezone,
    });

    await supabase
      .from('appointments')
      .update({
        appointment_date: newAppointmentStart,
        barber_id: newBarberId,
      })
      .eq('id', id);

    fetchAppointments();
  };

  // 🔹 NEW: persist duration change (called by Calendar on resize commit)
  const updateAppointmentDuration = async (id: string, newDurationMin: number) => {
    await supabase
      .from('appointments')
      .update({ duration_min: newDurationMin })
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
      customer_name: `${selectedAppointment.contact?.first_name || ''} ${selectedAppointment.contact?.last_name || ''}`.trim(),
    });
    setShowPaymentPanel(true);
  };

  const filtered =
    selectedBarber === 'Tutti'
      ? appointments.filter(
          (app) =>
            `${app.contact?.first_name || ''} ${app.contact?.last_name || ''}`.trim().toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : appointments.filter(
          (app) =>
            (`${app.contact?.first_name || ''} ${app.contact?.last_name || ''}`.trim().toLowerCase().includes(searchQuery.toLowerCase()) ||
              app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            app.barber_id === selectedBarber
        );

  const dateButtons = [0, 1, 2].map((offset) => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() + offset);
    return d;
  });

  if (!authLoading && !effectiveBusinessId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600">
          Profilo non configurato: nessun <code>business_id</code> collegato.
          Contatta l'amministratore.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: day buttons + datepicker */}
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
                  < DatePicker
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

          {/* Center: filters */}
          <div className="flex items-center gap-3">
            <Dropdown
              value={selectedBarber}
              onChange={setSelectedBarber}
              options={[
                { value: 'Tutti', label: 'Tutti' },
                ...barbers.map(barber => ({ value: barber.id, label: barber.name }))
              ]}
              className="w-40"
            />
            
            <Dropdown
              value={viewMode}
              onChange={(value) => setViewMode(value as 'day' | '3day' | 'week')}
              options={[
                { value: 'day', label: 'Giorno' },
                { value: '3day', label: '3 Giorni' },
                { value: 'week', label: 'Settimana' }
              ]}
              className="w-32"
            />
            
            <Dropdown
              value=""
              onChange={handleExceptionSelect}
              options={[
                { value: '', label: 'Eccezione' },
                { value: 'apertura', label: 'Apertura' },
                { value: 'chiusura', label: 'Chiusura' }
              ]}
              className="w-32"
            />
          </div>
          
          {/* Right: new appointment */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white px-6 py-2 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
          >
            <Plus size={18} className="mr-2" /> Nuovo Appuntamento
          </button>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
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

        <div className="flex-1 overflow-hidden">
          <Calendar
            timeSlots={timeSlots}
            appointments={filtered}
            businessTimezone={businessTimezone}
            barbers={barbers || []}
            selectedBarber={selectedBarber}
            datesInView={getDatesInView(selectedDate, viewMode)}
            onDrop={updateAppointmentTime}
            onClickAppointment={(app) => setSelectedAppointment(app)}
            onEmptySlotClick={(barberId, date, time) => {
              setSlotPrefill({ barberId, date, time });
              setShowCreateModal(true);
            }}
            // 🔹 pass duration persistence for resize
            onResizeDuration={updateAppointmentDuration}
          />
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentSummaryBanner
          appointment={selectedAppointment}
          businessTimezone={businessTimezone}
          onClose={() => setSelectedAppointment(null)}
          onPay={handlePay}
          onDelete={handleDelete}
        /> 
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          businessTimezone={businessTimezone}
          initialBarberId={slotPrefill?.barberId}
          initialDate={slotPrefill?.date}
          initialTime={slotPrefill?.time}
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
        businessId={effectiveBusinessId}
        onSuccess={() => {
          setShowPaymentPanel(false);
          fetchAppointments();
        }}
      />

      {showHeaderExceptionModal && (
        <AvailabilityExceptionFormModal 
          isOpen={showHeaderExceptionModal}
          onClose={handleExceptionModalClose}
          onSave={handleExceptionModalSave}
          barbers={barbers}
          businessId={effectiveBusinessId || ''}
          businessTimezone={businessTimezone}
          exceptionType={headerExceptionType}
          defaultValues={null}
        />
      )}
    </div>
  );
};

export default Agenda;