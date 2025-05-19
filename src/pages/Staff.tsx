import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit as EditIcon, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const weekdays = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const Staff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDay, setEditingDay] = useState(null);
  const [editedTimes, setEditedTimes] = useState({});

  const fetchStaff = async () => {
    const { data } = await supabase.from('barbers').select('*');
    setStaffMembers(data || []);
  };

  const fetchSchedule = async (barberId) => {
    const { data } = await supabase
      .from('barber_availability')
      .select('*')
      .eq('barber_id', barberId);

    const scheduleMap = {};
    data?.forEach(slot => {
      if (!scheduleMap[slot.weekday]) scheduleMap[slot.weekday] = [];
      scheduleMap[slot.weekday].push(slot);
    });

    setSelectedStaff(prev => ({ ...prev, schedule: scheduleMap }));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSelectStaff = async (staff) => {
    setSelectedStaff({ ...staff, schedule: {} });
    await fetchSchedule(staff.id);
  };

  const handleTimeChange = (field, value) => {
    setEditedTimes(prev => ({ ...prev, [field]: value }));
  };

  const saveSchedule = async (day, slotId) => {
    await supabase.from('barber_availability').update({
      start_time: editedTimes.start_time,
      end_time: editedTimes.end_time,
    }).eq('id', slotId);

    setEditingDay(null);
    fetchSchedule(selectedStaff.id);
  };

  const filteredStaff = staffMembers.filter((staff) =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="bg-white rounded-lg shadow md:col-span-1">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca staff"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y max-h-[700px] overflow-y-auto">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedStaff?.id === staff.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleSelectStaff(staff)}
              >
                <div className="flex items-center">
                  <img src={staff.avatar_url || 'https://via.placeholder.com/40'} className="h-12 w-12 rounded-full" />
                  <div className="ml-4">
                    <h3 className="text-sm font-medium">{staff.name}</h3>
                    <p className="text-xs text-gray-500">{staff.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow md:col-span-2">
          {selectedStaff ? (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{selectedStaff.name}</h2>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Orario di Lavoro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {weekdays.map((day) => (
                  <div key={day} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium capitalize">
                        {new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(new Date(`2025-05-19T00:00:00`).setDate(new Date().getDay() + weekdays.indexOf(day) - new Date().getDay()))}
                      </p>
                      {selectedStaff.schedule[day]?.[0] && editingDay !== day && (
                        <button onClick={() => {
                          setEditingDay(day);
                          setEditedTimes({
                            start_time: selectedStaff.schedule[day][0].start_time,
                            end_time: selectedStaff.schedule[day][0].end_time,
                          });
                        }}>
                          <EditIcon size={16} className="text-gray-500" />
                        </button>
                      )}
                    </div>
                    {selectedStaff.schedule[day]?.length ? (
                      editingDay === day ? (
                        <div className="space-y-1 mt-2">
                          <input
                            type="time"
                            value={editedTimes.start_time}
                            onChange={(e) => handleTimeChange('start_time', e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                          <input
                            type="time"
                            value={editedTimes.end_time}
                            onChange={(e) => handleTimeChange('end_time', e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                          <button
                            onClick={() => saveSchedule(day, selectedStaff.schedule[day][0].id)}
                            className="w-full mt-1 bg-green-600 text-white rounded px-2 py-1 text-sm flex items-center justify-center"
                          >
                            <Check size={16} className="mr-1" /> Salva
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mt-1">
                          {selectedStaff.schedule[day].map(slot => `${slot.start_time} - ${slot.end_time}`).join(', ')}
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-red-500 mt-1">Chiuso</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-2" />
              <p>Seleziona un membro dello staff per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff;