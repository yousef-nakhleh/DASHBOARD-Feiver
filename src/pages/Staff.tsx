// src/pages/Staff.tsx

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Edit,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewStaffModal from '../components/staff/NewStaffModal';
import AvailabilityEditor from '../components/staff/AvailabilityEditor';
import EditStaffModal from '../components/staff/EditStaffModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const Staff = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [availability, setAvailability] = useState<Record<string, any>>({});
  const [editing, setEditing] = useState(false);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data, error } = await supabase.from('barbers').select('*');
      if (!error) setStaffList(data);
    };
    fetchStaff();
  }, []);

  const handleStaffClick = async (staff: any) => {
    setSelectedStaff(staff);
    const { data } = await supabase
      .from('barbers_availabilities')
      .select('*')
      .eq('barber_id', staff.id);

    const mapped = data?.reduce((acc: any, curr: any) => {
      acc[curr.weekday] = {
        start: curr.start_time,
        end: curr.end_time,
      };
      return acc;
    }, {}) || {};

    setAvailability(mapped);
  };

  const handleNewStaffAdded = (newStaff: any) => {
    setStaffList((prev) => [...prev, newStaff]);
    setIsNewStaffModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Staff</h2>
          <p className="text-muted-foreground">Gestisci il team del salone</p>
        </div>
        <Button onClick={() => setIsNewStaffModalOpen(true)} className="bg-brown-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Membro
        </Button>
      </div>

      <div className="flex space-x-6">
        <div className="w-1/3">
          <input
            placeholder="Cerca staff"
            className="w-full mb-4 p-2 border rounded"
          />
          <ul className="space-y-2">
            {staffList.map((staff) => (
              <li
                key={staff.id}
                onClick={() => handleStaffClick(staff)}
                className={`p-3 rounded cursor-pointer border ${
                  selectedStaff?.id === staff.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="font-medium">{staff.name}</div>
                <div className="text-sm text-muted-foreground">{staff.role}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3">
          {selectedStaff ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{selectedStaff.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStaff.role}</p>
                    <div className="mt-4 space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        {selectedStaff.phone || '-'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        {selectedStaff.email || '-'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        Inizio: {selectedStaff.start_date || '-'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit size={18} />
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2">Orario di Lavoro</h4>
                  <AvailabilityEditor
                    editable={editing}
                    availability={availability}
                    setAvailability={setAvailability}
                    staffId={selectedStaff.id}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground">
              Seleziona un membro dello staff per visualizzare i dettagli
            </div>
          )}
        </div>
      </div>

      <NewStaffModal
        open={isNewStaffModalOpen}
        onClose={() => setIsNewStaffModalOpen(false)}
        onStaffCreated={handleNewStaffAdded}
      />

      <EditStaffModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        staff={selectedStaff}
        onStaffUpdated={(updated: any) => {
          setStaffList((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
          setSelectedStaff(updated);
        }}
      />
    </div>
  );
};

export default Staff;