import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Staff: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editedTimes, setEditedTimes] = useState<{ [key: string]: { start_time: string; end_time: string } }>({});

  const weekdays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const labels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

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
    const { data } = await supabase.from('barber_availability').select('*').eq('barber_id', barberId);
    setAvailability(data || []);
  };

  const handleEdit = (day: string, start: string, end: string) => {
    setEditingSlot(day);
    setEditedTimes({ [day]: { start_time: start, end_time: end } });
  };

  const handleSave = async (day: string) => {
    const existing = availability.find((a) => a.weekday === day);
    const values = editedTimes[day];

    if (existing) {
      await supabase.from('barber_availability').update(values).eq('id', existing.id);
    } else {
      await supabase.from('barber_availability').insert({
        barber_id: selectedStaff.id,
        weekday: day,
        ...values
      });
    }

    setEditingSlot(null);
    fetchAvailability(selectedStaff.id);
  };

  const getTimeLabel = (day: string) => {
    const slot = availability.find((a) => a.weekday === day);
    if (!slot) return 'Chiuso';
    return `${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}`;
  };

  const filteredStaff = staffList.filter((staff) => staff.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                onClick={() => setSelectedStaff(staff)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedStaff?.id === staff.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
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
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden">
                    <img src={selectedStaff.image_url} alt={selectedStaff.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedStaff.role}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Orario di Lavoro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {weekdays.map((day, idx) => (
                    <div key={day} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">{labels[idx]}</p>
                      {editingSlot === day ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            type="time"
                            value={editedTimes[day]?.start_time || ''}
                            onChange={(e) =>
                              setEditedTimes({
                                ...editedTimes,
                                [day]: { ...editedTimes[day], start_time: e.target.value },
                              })
                            }
                            className="text-sm border px-2 py-1 rounded"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={editedTimes[day]?.end_time || ''}
                            onChange={(e) =>
                              setEditedTimes({
                                ...editedTimes,
                                [day]: { ...editedTimes[day], end_time: e.target.value },
                              })
                            }
                            className="text-sm border px-2 py-1 rounded"
                          />
                          <button onClick={() => handleSave(day)} className="text-blue-600 text-xs font-semibold">Salva</button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-sm ${getTimeLabel(day) === 'Chiuso' ? 'text-red-500' : 'text-gray-700'}`}>{getTimeLabel(day)}</p>
                          <button onClick={() => handleEdit(day, availability.find((a) => a.weekday === day)?.start_time || '', availability.find((a) => a.weekday === day)?.end_time || '')}>
                            <Edit size={14} className="text-gray-500 hover:text-gray-800" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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