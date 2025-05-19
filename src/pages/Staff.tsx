import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Staff: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<any[]>([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) fetchAvailability(selectedStaff.id);
  }, [selectedStaff]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('barbers').select('*');
    setStaffList(data || []);
  };

  const fetchAvailability = async (barberId: string) => {
    const { data } = await supabase
      .from('barber_availability')
      .select('*')
      .eq('barber_id', barberId);
    setWeeklyAvailability(data || []);
  };

  const handleTimeChange = async (day: string, start: string, end: string) => {
    const entry = weeklyAvailability.find((a) => a.weekday === day);
    if (entry) {
      await supabase
        .from('barber_availability')
        .update({ start_time: start, end_time: end })
        .eq('id', entry.id);
    } else {
      await supabase.from('barber_availability').insert({
        barber_id: selectedStaff.id,
        weekday: day,
        start_time: start,
        end_time: end,
      });
    }
    fetchAvailability(selectedStaff.id);
  };

  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-600">Gestisci il team del salone</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" /> Nuovo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca staff"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedStaff?.id === staff.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedStaff(staff)}
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img src={staff.image_url} alt={staff.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium">{staff.name}</h3>
                    <p className="text-xs text-gray-500">{staff.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedStaff ? (
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 rounded-full overflow-hidden">
                  <img src={selectedStaff.image_url} alt={selectedStaff.name} className="h-full w-full object-cover" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                  <p className="text-gray-600">{selectedStaff.role}</p>
                </div>
              </div>

              <h3 className="text-sm font-medium text-gray-500 mb-2">Modifica Disponibilità Settimanale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekdays.map((day) => {
                  const entry = weeklyAvailability.find((a) => a.weekday === day);
                  return (
                    <div key={day} className="bg-gray-50 p-4 rounded-lg">
                      <p className="capitalize font-semibold mb-2">
                        {day === 'monday' ? 'Lunedì' :
                         day === 'tuesday' ? 'Martedì' :
                         day === 'wednesday' ? 'Mercoledì' :
                         day === 'thursday' ? 'Giovedì' :
                         day === 'friday' ? 'Venerdì' :
                         day === 'saturday' ? 'Sabato' : 'Domenica'}
                      </p>
                      <div className="flex space-x-2">
                        <input
                          type="time"
                          className="border px-2 py-1 rounded w-full"
                          value={entry?.start_time || ''}
                          onChange={(e) => handleTimeChange(day, e.target.value, entry?.end_time || '')}
                        />
                        <input
                          type="time"
                          className="border px-2 py-1 rounded w-full"
                          value={entry?.end_time || ''}
                          onChange={(e) => handleTimeChange(day, entry?.start_time || '', e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500">
              <Users size={48} className="mb-2" />
              <p>Seleziona un membro dello staff per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff;
