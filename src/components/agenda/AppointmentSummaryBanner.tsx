import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, User, Clock, DollarSign, CreditCard, X } from 'lucide-react';
import { toLocalFromUTC } from '../../lib/timeUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

const AppointmentSummaryBanner = ({ appointment, businessTimezone, onEdit, onPay, onDelete, onClose }) => {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState('summary'); // 'summary' or 'contact'
  const [contactDetails, setContactDetails] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(appointment?.duration_min || appointment?.services?.duration_min || 30);
  const [availableDurations, setAvailableDurations] = useState([]);
  const [busyTimes, setBusyTimes] = useState(new Set());

  if (!appointment) return null;

  // Convert appointment_date (timestamptz) to local time for display
  const localTime = toLocalFromUTC({
    utcString: appointment.appointment_date,
    timezone: businessTimezone,
  });

  const displayDate = localTime.toFormat('yyyy-MM-dd');
  const displayTime = localTime.toFormat('HH:mm');

  // Fetch contact details
  useEffect(() => {
    const fetchContactDetails = async () => {
      if (!appointment.contact?.id) return;

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', appointment.contact.id)
        .single();

      if (!error && data) {
        setContactDetails(data);
      }
    };

    fetchContactDetails();
  }, [appointment.contact?.id]);

  // Generate duration options and check for conflicts
  useEffect(() => {
    const generateDurationOptions = () => {
      const baseDuration = appointment?.services?.duration_min || 30;
      const options = [];
      
      // Generate options from 15 to 120 minutes in 5-minute increments
      for (let duration = 15; duration <= 120; duration += 5) {
        options.push(duration);
      }
      
      return options;
    };

    const checkConflicts = async () => {
      if (!appointment?.barber_id || !profile?.business_id) return;

      // Fetch appointments for the same day and barber
      const startOfDay = localTime.startOf('day').toUTC().toISO();
      const endOfDay = localTime.endOf('day').toUTC().toISO();

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, duration_min, services(duration_min), id')
        .eq('barber_id', appointment.barber_id)
        .eq('business_id', profile.business_id)
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .in('appointment_status', ['pending', 'confirmed']);

      if (error) return;

      const conflicts = new Set();
      const currentStart = new Date(appointment.appointment_date);
      
      generateDurationOptions().forEach(duration => {
        const currentEnd = new Date(currentStart.getTime() + duration * 60000);
        
        const hasConflict = data?.some(appt => {
          if (appt.id === appointment.id) return false; // Skip current appointment
          
          const apptStart = new Date(appt.appointment_date);
          const apptDuration = appt.duration_min || appt.services?.duration_min || 30;
          const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);
          
          return currentStart < apptEnd && currentEnd > apptStart;
        });
        
        if (hasConflict) {
          conflicts.add(duration);
        }
      });

      setBusyTimes(conflicts);
      setAvailableDurations(generateDurationOptions());
    };

    checkConflicts();
  }, [appointment, localTime, profile?.business_id]);

  const handleDurationChange = async (newDuration) => {
    if (busyTimes.has(newDuration)) return;
    
    setSelectedDuration(newDuration);
    
    // Update the appointment duration in the database
    const { error } = await supabase
      .from('appointments')
      .update({ duration_min: newDuration })
      .eq('id', appointment.id);

    if (error) {
      console.error('Error updating duration:', error);
    }
  };

  const handlePayAndConfirm = () => {
    // This will trigger the payment flow and mark as paid
    onPay();
  };

  const ContactInfoView = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentView('summary')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-3"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-lg font-bold text-black">Informazioni Contatto</h3>
      </div>

      {contactDetails ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Nome Completo</label>
            <p className="text-black font-medium">
              {`${contactDetails.first_name || ''} ${contactDetails.last_name || ''}`.trim() || 'Non disponibile'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</label>
            <p className="text-black">{contactDetails.email || 'Non disponibile'}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Telefono</label>
            <p className="text-black">{contactDetails.phone_number_e164 || 'Non disponibile'}</p>
          </div>

          {contactDetails.birthdate && (
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Data di Nascita</label>
              <p className="text-black">{new Date(contactDetails.birthdate).toLocaleDateString('it-IT')}</p>
            </div>
          )}

          {contactDetails.notes && (
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Note</label>
              <p className="text-black">{contactDetails.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Caricamento informazioni contatto...</p>
      )}
    </div>
  );

  const SummaryView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-black">Riepilogo Prenotazione</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-black"
        >
          <X size={20} />
        </button>
      </div>

      {/* Contact Info with Info Button */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User size={16} className="text-gray-400 mr-3" />
            <span className="font-semibold text-black">
              {`${appointment.contact?.first_name || ''} ${appointment.contact?.last_name || ''}`.trim() || 'Non disponibile'}
            </span>
          </div>
          <button
            onClick={() => setCurrentView('contact')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Visualizza informazioni contatto"
          >
            <Info size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Service and Duration */}
      <div className="space-y-4">
        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Servizio</span>
          <p className="text-lg font-semibold text-black mt-1">{appointment.services?.name || 'Non disponibile'}</p>
        </div>

        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Durata</span>
          <div className="mt-2">
            <select
              value={selectedDuration}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
            >
              {availableDurations.map(duration => (
                <option 
                  key={duration} 
                  value={duration}
                  disabled={busyTimes.has(duration)}
                  className={busyTimes.has(duration) ? 'text-gray-400' : ''}
                >
                  {duration} minuti {busyTimes.has(duration) ? '(conflitto)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Data</span>
          <p className="text-lg font-semibold text-black mt-1">{displayDate}</p>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Orario</span>
          <p className="text-lg font-semibold text-black mt-1">{displayTime}</p>
        </div>
      </div>

      {/* Staff and Price */}
      <div className="space-y-4">
        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Operatore</span>
          <p className="text-lg font-semibold text-black mt-1">
            {appointment.barber?.name || 'Non assegnato'}
          </p>
        </div>

        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Prezzo</span>
          <p className="text-lg font-semibold text-black mt-1">
            €{appointment.services?.price || 'Non disponibile'}
          </p>
        </div>
      </div>

      {/* Payment Status */}
      <div>
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pagamento</span>
        <div className="flex items-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${appointment.paid ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p className="text-lg font-semibold text-black">{appointment.paid ? 'Completato' : 'In sospeso'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
      <div className="p-6 h-full flex flex-col">
        <div className="flex-1">
          {currentView === 'summary' ? <SummaryView /> : <ContactInfoView />}
        </div>

        {/* Action Buttons - Only show in summary view */}
        {currentView === 'summary' && (
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-3">
            <button
              onClick={handlePayAndConfirm}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
            >
              <CreditCard size={18} className="mr-2" />
              Conferma e Paga
            </button>
            <button
              onClick={() => window.location.href = '/cassa'}
              className="w-full flex items-center justify-center px-4 py-3 bg-black hover:bg-gray-800 rounded-xl text-white font-medium transition-colors"
            >
              <DollarSign size={18} className="mr-2" />
              Vai alla Cassa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentSummaryBanner;