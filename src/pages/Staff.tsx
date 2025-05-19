import { useState, useEffect } from "react";
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
  Pencil,
  Check,
  X
} from "lucide-react";
import { supabase } from "../lib/supabase";

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const days = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
    "Domenica",
  ];

  const fetchStaff = async () => {
    const { data } = await supabase.from("barbers").select("*");
    setStaffList(data);
  };

  const fetchAvailability = async (barber_id) => {
    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("barber_id", barber_id);
    setAvailability(data);
  };

  const saveDay = async (day) => {
    const existing = availability.find(
      (a) => a.weekday === day && a.barber_id === selectedStaff.id
    );
    if (existing) {
      await supabase
        .from("availability")
        .update({ start_time: startTime, end_time: endTime })
        .eq("id", existing.id);
    } else {
      await supabase.from("availability").insert({
        barber_id: selectedStaff.id,
        weekday: day,
        start_time: startTime,
        end_time: endTime,
      });
    }
    setEditingDay(null);
    fetchAvailability(selectedStaff.id);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchAvailability(selectedStaff.id);
    }
  }, [selectedStaff]);

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4">
        {/* Staff List */}
        <div className="col-span-1 border-r pr-4">
          <input
            className="mb-4 w-full border px-2 py-1"
            placeholder="Cerca"
          />
          {staffList.map((staff) => (
            <div
              key={staff.id}
              onClick={() => setSelectedStaff(staff)}
              className={`p-2 cursor-pointer rounded hover:bg-gray-100 ${
                selectedStaff?.id === staff.id ? "bg-gray-100" : ""
              }`}
            >
              {staff.name}
            </div>
          ))}
        </div>

        {/* Staff Details */}
        <div className="col-span-3">
          {selectedStaff ? (
            <>
              <h2 className="text-xl font-bold mb-4">{selectedStaff.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {days.map((day) => {
                  const match = availability.find((a) => a.weekday === day);
                  const isEditing = editingDay === day;
                  return (
                    <div key={day} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">{day}</p>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveDay(day)}
                              className="text-green-600"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingDay(null)}
                              className="text-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingDay(day);
                              setStartTime(match?.start_time || "09:00");
                              setEndTime(match?.end_time || "18:00");
                            }}
                            className="text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="mt-2 space-y-1">
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full border px-2 py-1 text-sm"
                          />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full border px-2 py-1 text-sm"
                          />
                        </div>
                      ) : (
                        <p className={`text-sm ${!match ? "text-red-500" : "text-gray-700"}`}>
                          {match ? `${match.start_time} - ${match.end_time}` : "Chiuso"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p>Seleziona un membro dello staff per visualizzare i dettagli</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff;
