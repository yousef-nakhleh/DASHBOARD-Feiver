import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const Staff = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from("barbers").select("*");
    setStaffList(data || []);
  };

  const fetchAvailability = async (barberId: string) => {
    const { data } = await supabase
      .from("barbers_availabilities")
      .select("*")
      .eq("barber_id", barberId);
    setAvailability(data || []);
  };

  const handleSelectStaff = (staff: any) => {
    setSelectedStaff(staff);
    fetchAvailability(staff.id);
  };

  const formatDay = (day: string) => {
    const map: any = {
      monday: "Lunedì",
      tuesday: "Martedì",
      wednesday: "Mercoledì",
      thursday: "Giovedì",
      friday: "Venerdì",
      saturday: "Sabato",
      sunday: "Domenica",
    };
    return map[day] || day;
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-600">Gestisci il team del salone</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuovo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca staff"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                onChange={(e) => {
                  const search = e.target.value.toLowerCase();
                  setStaffList((prev) => prev.filter((s) => s.name.toLowerCase().includes(search)));
                }}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedStaff?.id === staff.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => handleSelectStaff(staff)}
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img src={staff.avatar_url || "https://via.placeholder.com/150"} alt={staff.name} className="h-full w-full object-cover" />
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

        {/* Staff details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedStaff ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden">
                    <img src={selectedStaff.avatar_url || "https://via.placeholder.com/150"} alt={selectedStaff.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedStaff.role}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contatti</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-gray-400" />
                      {selectedStaff.phone || "-"}
                    </div>
                    <div className="flex items-center">
                      <Mail size={16} className="mr-2 text-gray-400" />
                      {selectedStaff.email || "-"}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      Inizio: {selectedStaff.start_date ? new Date(selectedStaff.start_date).toLocaleDateString("it-IT") : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Orario di Lavoro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availability.length > 0 ? (
                    availability.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium capitalize">{formatDay(slot.weekday)}</p>
                        <p className="text-sm text-gray-700">
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nessuna disponibilità inserita.</p>
                  )}
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
