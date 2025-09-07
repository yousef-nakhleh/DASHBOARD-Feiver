import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewStaffModal from '../components/staff/NewStaffModal';
import EditStaffAvailabilityModal from '../components/staff/EditStaffAvailabilityModal';
import { useAuth } from '../components/auth/AuthContext'; // ⬅️ keep AuthContext for loading
import { useSelectedBusiness } from '../components/auth/SelectedBusinessProvider'; // ⬅️ NEW

// Weekday mapping from English (database) to Italian (display)
const dayMap: Record<string, string> = {
  monday:    'Lunedì',
  tuesday:   'Martedì',
  wednesday: 'Mercoledì',
  thursday:  'Giovedì',
  friday:    'Venerdì',
  saturday:  'Sabato',
  sunday:    'Domenica',
};

const Staff = () => {
  const { loading: authLoading } = useAuth(); // ⬅️ only loading from AuthContext
  const { effectiveBusinessId: businessId } = useSelectedBusiness(); // ⬅️ business id source

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isEditAvailabilityOpen, setIsEditAvailabilityOpen] = useState(false);
  const [availabilities, setAvailabilities] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) {
      // No business linked to this profile: clear data
      setStaffList([]);
      setSelectedStaff(null);
      setAvailabilities([]);
      return;
    }
    fetchStaff(businessId);
  }, [authLoading, businessId]);

  const fetchStaff = async (bizId: string) => {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('business_id', bizId);

    if (!error && data) setStaffList(data);
    else setStaffList([]);
  };

  const fetchAvailability = async (barberId: string, bizId: string) => {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('barber_id', barberId)
      .eq('business_id', bizId);

    if (!error && data) setAvailabilities(data);
    else setAvailabilities([]);
  };

  const handleSelect = async (staff: any) => {
    setSelectedStaff(staff);
    if (businessId) {
      await fetchAvailability(staff.id, businessId);
    } else {
      setAvailabilities([]);
    }
  };

  /* 🔴 REAL-TIME SUBSCRIPTION (ADD-ON ONLY)
     - Listens to INSERT/UPDATE/DELETE on `availability`
     - Scoped by business_id; filtered in handler by selectedStaff.id
     - Refreshes the availability list live
  */
  useEffect(() => {
    if (!businessId || !selectedStaff?.id) return;

    const channel = supabase
      .channel(`availability-realtime-${businessId}-${selectedStaff.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'availability',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const changedBarber =
            (payload.new as any)?.barber_id ?? (payload.old as any)?.barber_id;
          if (changedBarber === selectedStaff.id) {
            fetchAvailability(selectedStaff.id, businessId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, selectedStaff?.id]);
  // 🔴 END REAL-TIME SUBSCRIPTION

  // Group availability slots by weekday
  const groupedAvailability: { [key: string]: any[] } = availabilities.reduce((acc: any, slot) => {
    if (!acc[slot.weekday]) acc[slot.weekday] = [];
    acc[slot.weekday].push(slot);
    return acc;
  }, {});

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Staff</h1>
          <p className="text-gray-600">Gestisci il team del salone</p>
        </div>
        <button
          onClick={() => setIsNewStaffModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
          disabled={!businessId}
          title={!businessId ? 'Profilo non configurato (business non collegato)' : undefined}
        >
          <Plus size={18} className="mr-2" />
          Nuovo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff list */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca staff"
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                // Searching not implemented in original; keeping UI intact
                onChange={() => {}}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedStaff?.id === staff.id ? 'bg-gray-50 border-l-4 border-black' : ''
                }`}
                onClick={() => handleSelect(staff)}
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={staff.avatar_url || 'https://via.placeholder.com/48'}
                      alt={staff.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-black">{staff.name}</h3>
                    <p className="text-sm text-gray-500">{staff.role || 'Staff Member'}</p>
                  </div>
                </div>
              </div>
            ))}
            {!authLoading && businessId && staffList.length === 0 && (
              <div className="p-6 text-sm text-gray-500">Nessun membro dello staff trovato.</div>
            )}
            {!authLoading && !businessId && (
              <div className="p-6 text-sm text-gray-500">
                Profilo non configurato. Nessun business associato.
              </div>
            )}
          </div>
        </div>

        {/* Staff details */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {selectedStaff ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={selectedStaff.avatar_url || 'https://via.placeholder.com/80'}
                      alt={selectedStaff.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-black">{selectedStaff.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedStaff.role || 'Staff Member'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contatti</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{selectedStaff.phone || 'Non disponibile'}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{selectedStaff.email || 'Non disponibile'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">Inizio: {selectedStaff.start_date || 'Non disponibile'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Orario di Lavoro</h3>
                  <button
                    onClick={() => setIsEditAvailabilityOpen(true)}
                    className="text-sm text-black hover:text-gray-600 font-medium transition-colors"
                  >
                    Modifica →
                  </button>
                </div>

                {Object.keys(groupedAvailability).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(groupedAvailability).map(([weekday, slots]) => (
                      <div key={weekday} className="p-4 bg-gray-50 rounded-xl">
                        <p className="font-semibold text-black mb-2">{dayMap[weekday] || weekday}</p>
                        {slots.map((slot, idx) => (
                          <p key={idx} className="text-sm text-gray-700">
                            {slot.start_time} – {slot.end_time}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nessuna disponibilità inserita.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500">
              <Users size={48} className="mb-4" />
              <p>Seleziona un membro dello staff per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isNewStaffModalOpen && (
        <NewStaffModal
          open={isNewStaffModalOpen}
          onOpenChange={setIsNewStaffModalOpen}
          onCreated={(newStaff) => setStaffList((prev) => [...prev, newStaff])}
        />
      )}

      {selectedStaff && isEditAvailabilityOpen && (
        <EditStaffAvailabilityModal
          barberId={selectedStaff.id}
          businessId={businessId || ''} // ⬅️ pass dynamic businessId
          open={isEditAvailabilityOpen}
          onClose={() => setIsEditAvailabilityOpen(false)}
          onUpdated={() => {
            setIsEditAvailabilityOpen(false);
            if (businessId) fetchAvailability(selectedStaff.id, businessId);
          }}
        />
      )}
    </div>
  );
};

export default Staff;