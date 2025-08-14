import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { toUTCFromLocal } from '@/lib/timeUtils';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { format, set } from 'date-fns';

const CreateAppointmentModal = ({ isOpen, onClose, businessTimezone, selectedDate, barbers, services, onAppointmentCreated }) => {
  const supabase = useSupabaseClient();
  const [customerName, setCustomerName] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [date, setDate] = useState(selectedDate || new Date());
  const [time, setTime] = useState('12:00');

  useEffect(() => {
    if (selectedDate) setDate(selectedDate);
  }, [selectedDate]);

  const handleCreate = async () => {
    if (!customerName || !selectedService || !selectedBarber || !time) return;

    const [hours, minutes] = time.split(':').map(Number);
    const localDateTime = set(date, { hours, minutes });

    const appointmentDateUTC = toUTCFromLocal({ localDateTime, timezone: businessTimezone });

    const { error } = await supabase.from('appointments').insert([
      {
        contact_name: customerName,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: appointmentDateUTC.toISO(),
      },
    ]);

    if (!error) {
      onAppointmentCreated();
      onClose();
    } else {
      console.error('Errore nella creazione:', error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <h2 className="text-xl font-bold mb-4">Nuovo Appuntamento</h2>

        <div className="space-y-3">
          <div>
            <Label>Nome Cliente</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <div>
            <Label>Servizio</Label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Seleziona un servizio</option>
              {services.map((service) => (
                <option key={service.uuid} value={service.uuid}>
                  {service.name} ({service.duration_min} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Barbiere</Label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedBarber || ''}
              onChange={(e) => setSelectedBarber(e.target.value)}
            >
              <option value="">Seleziona un barbiere</option>
              {barbers.map((barber) => (
                <option key={barber.uuid} value={barber.uuid}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Data</Label>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </div>

          <div>
            <Label>Orario</Label>
            <TimePicker value={time} onChange={setTime} />
          </div>

          <Button className="w-full mt-4" onClick={handleCreate}>
            Crea Appuntamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAppointmentModal;