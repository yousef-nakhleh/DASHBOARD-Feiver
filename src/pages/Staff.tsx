// src/pages/Staff.tsx
import React, { useEffect, useState } from 'react';
import {
  Users, Search, Plus, Phone, Mail, Calendar, Clock, Edit, Trash2, Check, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const weekdays = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const Staff = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [updatedAvailability, setUpdatedAvailability] = useState<Record<string, { start: string, end: string }>>({});

  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase.from('barbers').select('*');
      setStaffList(data || []);
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!selectedStaff) return;
    const fetchAvailability = async () => {
      const { data } = await supabase
        .from('barbers_availabilities')
        .select('*')
        .eq('barber_id', selectedStaff.id);
      setAvailability(data || []);

      const preset: Record<string, { start: string, end: string }> = {};
      for (const day of weekdays) {
        const found = data?.find((a: any) => a.weekday === day);
        preset[day] = found ? {
          start: found.start_time?.slice(0, 5),
          end: found.end_time?.slice(0, 5)
        } : { start: '', end: '' };
      }
      setUpdatedAvailability(preset);
    };
    fetchAvailability();
  }, [selectedStaff]);

  const handleAvailabilityChange = (day: string, field: 'start' | 'end', value: string) => {
    setUpdatedAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSaveAvailability = async () => {
    await supabase
      .from('barbers_availabilities')
      .delete()
      .eq('barber_id', selectedStaff.id);

    const entries = weekdays
      .filter(day => updatedAvailability[day].start && updatedAvailability[day].end)
      .map(day => ({
        barber_id: selectedStaff.id,
        weekday: day,
        start_time: updatedAvailability[day].start,
        end_time: updatedAvailability[day].end
      }));

    await supabase.from('barbers_availabilities').insert(entries);
    setEditing(false);
    setAvailability(entries);
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-600">Gestisci il team del salone</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center">
          <Plus size={18} className="mr-2" /> Nuovo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg overflow-y-auto max-h-[700px]">
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca staff"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          {staffList.map(staff => (
            <div
              key={staff.id}
              onClick={() => setSelectedStaff(staff)}
              className={`p-4 flex items-center cursor-pointer hover:bg-gray-100 ${selectedStaff?.id === staff.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                <img src={staff.avatar_url || ''} alt={staff.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-medium text-sm">{staff.name}</p>
                <p className="text-xs text-gray-500">{staff.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedStaff ? (
            <>
              <div className="flex justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
                    <img src={selectedStaff.avatar_url || ''} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                    <p className="text-sm text-gray-600">{selectedStaff.role}</p>
                  </div>
                </div>
                <button onClick={() => setEditing(!editing)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-full">
                  {editing ? <X size={18} /> : <Edit size={18} />}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contatti</h3>
                  <div className="space-y-2">
                    <div className="flex items-center"><Phone size={16} className="mr-2 text-gray-400" /> {selectedStaff.phone || '-'}</div>
                    <div className="flex items-center"><Mail size={16} className="mr-2 text-gray-400" /> {selectedStaff.email || '-'}</div>
                    <div className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> Inizio: {selectedStaff.start_date ? new Date(selectedStaff.start_date).toLocaleDateString('it-IT') : '-'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Orario di Lavoro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {weekdays.map(day => (
                    <div key={day} className="bg-gray-50 p-3 rounded-lg">
                      <p className="capitalize font-medium text-sm">{day}</p>
                      {!editing ? (
                        <p className="text-sm text-gray-700">
                          {availability.find(a => a.weekday === day) ?
                            `${updatedAvailability[day]?.start} - ${updatedAvailability[day]?.end}` :
                            'Chiuso'}
                        </p>
                      ) : (
                        <div className="flex space-x-1">
                          <input type="time" value={updatedAvailability[day]?.start} onChange={e => handleAvailabilityChange(day, 'start', e.target.value)} className="border rounded px-1 text-sm" />
                          <span>-</span>
                          <input type="time" value={updatedAvailability[day]?.end} onChange={e => handleAvailabilityChange(day, 'end', e.target.value)} className="border rounded px-1 text-sm" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {editing && (
                  <button onClick={handleSaveAvailability} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center">
                    <Check className="mr-2" size={16} /> Salva Orari
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
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
