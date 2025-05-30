const handleCreate = async () => {
  if (!selectedDate || !selectedTime || !selectedBarber || !selectedService) {
    alert('Please fill in all fields.');
    return;
  }

  const selectedStart = new Date(`${selectedDate}T${selectedTime}:00`);
  const selectedEnd = new Date(selectedStart.getTime() + duration * 60000);

  const { data: existingAppointments, error } = await supabase
    .from('appointments')
    .select('appointment_time, duration_min')
    .eq('barber_id', selectedBarber)
    .eq('appointment_date', selectedDate);

  if (error) {
    console.error('Error checking overlaps:', error.message);
    return;
  }

  const conflict = (existingAppointments || []).some((appt) => {
    const apptStart = new Date(`${selectedDate}T${appt.appointment_time}`);
    const apptEnd = new Date(apptStart.getTime() + appt.duration_min * 60000);
    return selectedStart < apptEnd && selectedEnd > apptStart; // overlap condition
  });

  if (conflict) {
    alert('This time slot overlaps with another appointment.');
    return;
  }

  const isoDate = new Date(selectedDate).toISOString().split('T')[0];

  const { error: insertError } = await supabase.from('appointments').insert([
    {
      customer_name: customerName,
      service_id: selectedService,
      barber_id: selectedBarber,
      appointment_date: isoDate,
      appointment_time: selectedTime,
      duration_min: duration,
    },
  ]);

  if (!insertError) {
    onCreated();
    onClose();
  } else {
    console.error('Error creating appointment:', insertError.message);
  }
};