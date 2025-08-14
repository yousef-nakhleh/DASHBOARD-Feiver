// src/components/agenda/CreateAppointmentModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ContactPickerModal from './ContactPickerModal';
import { UserRoundSearch, X } from 'lucide-react';
import { formatDateToYYYYMMDDLocal } from '../../lib/utils';
import { toUTCFromLocal, toLocalFromUTC } from '../../lib/timeUtils';
import { useAuth } from '../auth/AuthContext';

const CreateAppointmentModal = ({
  businessTimezone,
  onClose,
  onCreated,
  initialBarberId = '',
  initialDate = '',
  initialTime = '',
}) => {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(
    initialDate || formatDateToYYYYMMDDLocal(new Date())
  );
  const [selectedTime, setSelectedTime] = useState(initialTime || '07:00');
  const [duration, setDuration] = useState(30);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId);

      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .eq('business_id', businessId);

      setServices(servicesData || []);
      setBarbers(barbersData || []);
    };
    fetchData();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;

    const fetchAppointments = async () => {
      if (!selectedDate || !selectedBarber) return;

      const startOfDay = toUTCFromLocal({
        date: selectedDate,
        time: '00:00',
        timezone: businessTimezone,
      });
      const endOfDay = toUTCFromLocal({
        date: selectedDate,
        time: '23:59',
        timezone: businessTimezone,
      });

      const { data } = await supabase
        .from('appointments')
        .select('appointment_date, duration_min')
        .eq('barber_id', selectedBarber)
        .eq('business_id', businessId)
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .or('appointment_status.is.null,appointment_status.neq.cancelled');

      setAppointments(data || []);
    };
    fetchAppointments();
  }, [selectedDate, selectedBarber, businessTimezone, businessId]);

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    setSelectedService(selectedId);
    const matchedService = services.find((s) => s.id === selectedId);
    if (matchedService) setDuration(matchedService.duration_min);
  };

  const handleCreate = async () => {
    if (!businessId) {
      setErrorMsg('Profilo non configurato: nessun business associato. Contatta l\'amministratore.');
      return;
    }
    if (!selectedDate || !selectedTime || !selectedService || !selectedBarber) return;

    const appointmentStartUTC = toUTCFromLocal({
      date: selectedDate,
      time: selectedTime,
      timezone: businessTimezone,
    });

    const start = new Date(appointmentStartUTC);
    const end = new Date(start.getTime() + duration * 60000);

    const overlap = appointments.some((appt) => {
      const apptStart = new Date(appt.appointment_date);
      const apptEnd = new Date(apptStart.getTime() + appt.duration_min * 60000);
      return start < apptEnd && end > apptStart;
    });

    if (overlap) {
      setErrorMsg('Questo orario è già occupato.');
      return;
    }

    const { error } = await supabase.from('appointments').insert([
      {
        customer_name: customerName,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: appointmentStartUTC,
        duration_min: duration,
        business_id: businessId,
      },
    ]);

    if (!error) {
      onCreated();
      onClose();
    } else {
      console.error('Errore creazione:', error.message);
      setErrorMsg('Errore durante la creazione dell’appuntamento.');
    }
  };

  const handleSelectContact = (contact) => {
    setCustomerName(contact.customer_name);
    setShowContactPicker(false);
  };

  return (
    // ... component JSX unchanged ...
  );
};

export default CreateAppointmentModal;
