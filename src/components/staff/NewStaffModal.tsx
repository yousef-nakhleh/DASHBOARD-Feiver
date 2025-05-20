const handleSave = async () => {
  const { data: barberData, error: barberError } = await supabase
    .from('barbers')
    .insert([
      {
        name,
        phone,
        email,
        avatar_url: avatarUrl,
      },
    ])
    .select()
    .single();

  if (barberError) {
    console.error('Error saving barber:', barberError);
    return;
  }

  const availabilityInserts = Object.entries(weeklyAvailability)
    .filter(([, times]) => times.start && times.end)
    .map(([weekday, times]) => ({
      barber_id: barberData.id, // or barberData.uuid if you're using UUIDs
      weekday,
      start_time: times.start,
      end_time: times.end,
    }));

  if (availabilityInserts.length > 0) {
    const { error: availError } = await supabase
      .from('barbers_availabilities')
      .insert(availabilityInserts);

    if (availError) {
      console.error('Error saving availability:', availError);
    }
  }

  onCreated(barberData); // Update the list
  onOpenChange(false);   // Close modal
};