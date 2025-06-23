import { useState } from "react";
import { Appointment } from "@/types"; // assicurati che sia importato correttamente
import PaymentForm from "@/components/payment/PaymentForm";

interface EditAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSave: (updatedAppointment: Appointment) => void;
}

export default function EditAppointmentModal({
  appointment,
  onClose,
  onSave,
}: EditAppointmentModalProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "payment">("edit");
  const [editedAppointment, setEditedAppointment] = useState(appointment);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedAppointment((prev) => ({
      ...prev,
      [name]: name === "duration_min" ? parseInt(value) : value,
    }));
  };

  const handleSave = () => {
    onSave(editedAppointment);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-md p-6 w-[90%] max-w-md">
        <div className="flex mb-4 space-x-2">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === "edit" ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-700"
            }`}
          >
            Modifica
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === "payment" ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-700"
            }`}
          >
            Pagamento
          </button>
        </div>

        {activeTab === "edit" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Nome Cliente</label>
              <input
                type="text"
                name="customer_name"
                value={editedAppointment.customer_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Servizio</label>
              <select
                name="service_name"
                value={editedAppointment.service_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="Haircut">Haircut</option>
                <option value="Color">Color</option>
                <option value="Balayage">Balayage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Data</label>
              <input
                type="date"
                name="appointment_date"
                value={editedAppointment.appointment_date}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Orario</label>
              <input
                type="time"
                name="appointment_time"
                value={editedAppointment.appointment_time}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Durata (minuti)</label>
              <input
                type="number"
                name="duration_min"
                value={editedAppointment.duration_min}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-zinc-200 rounded">
                Annulla
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
                Salva
              </button>
            </div>
          </div>
        ) : (
          <PaymentForm appointment={editedAppointment} onClose={onClose} />
        )}
      </div>
    </div>
  );
}