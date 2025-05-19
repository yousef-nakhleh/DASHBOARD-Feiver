import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, Calendar, Clock, Edit, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Staff: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingStart, setEditingStart] = useState('');
  const [editingEnd, setEditingEnd] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) fetchAvailability();
  }, [selectedStaff]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('barbers').select('*');
    setStaffMembers(data || []);
  };

  const fetchAvailability = async () => {
    const { data } = await supabase
      .from('weekly_availability')
      .select('*')
      .eq('barber_id', selectedStaff.id);
    setAvailabilities(data || []);
  };

  const handleSave = async () => {
    if (!editingDay || !editingStart || !editingEnd || !selectedStaff) return;
    await supabase.from('weekly_availability').upsert({
      barber_id: selectedStaff.id,
      weekday: editingDay,
      start_time: editingStart,
      end_time: editingEnd,
    });
    setEditingDay(null);
    setEditingStart('');
    setEditingEnd('');
    fetchAvailability();
  };

  const filteredStaff = staffMembers.filter(
    staff => staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-600">Gestisci il team del salone</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E]">
          <Plus size={18} className="mr-1" /> Nuovo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow">
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
          <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedStaff?.id === staff.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                onClick={() => setSelectedStaff(staff)}
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img src={staff.image} alt={staff.name} className="h-full w-full object-cover" />
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
              <div className="flex items-center mb-6">
                <div className="h-20 w-20 rounded-full overflow-hidden">
                  <img src={selectedStaff.image} className="h-full w-full object-cover" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                  <p className="text-gray-600">{selectedStaff.role}</p>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Orario di Lavoro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => {
                  const daySlots = availabilities.filter(a => a.weekday === day);
                  return (
                    <div key={day} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium capitalize">{day}</p>
                        <button
                          onClick={() => setEditingDay(day)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      {daySlots.length === 0 ? (
                        <p className="text-red-500 text-sm mt-1">Chiuso</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {daySlots.map((slot, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              {slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}
                            </li>
                          ))}
                        </ul>
                      )}
                      {editingDay === day && (
                        <div className="mt-2 space-y-2">
                          <input type="time" value={editingStart} onChange={e => setEditingStart(e.target.value)} className="border rounded px-2 py-1 w-full" />
                          <input type="time" value={editingEnd} onChange={e => setEditingEnd(e.target.value)} className="border rounded px-2 py-1 w-full" />
                          <button onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 text-sm px-2 py-1 rounded w-full">
                            Salva
                          </button>
                        </div>
                      )}
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