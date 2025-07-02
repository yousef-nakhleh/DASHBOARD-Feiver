// src/components/staff/EditAppointmentModal.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";              // 🔹 nuovo import
import { Appointment } from "@/types";
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

  /* ------------------------- handlers ------------------------- */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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

  // 🔹 NUOVO: aggiorna appointment_status a “cancellato”
  const handleDelete = async () => {
    const ok = window.confirm("Vuoi cancellare questo appuntamento?");
    if (!ok) return;

    const { data, error } = await supabase
      .from("appointments")
      .update({ appointment_status: "cancellato" })
      .eq("id", appointment.id)
      .select()
      .single();

    if (error) {
      alert("Errore durante la cancellazione 🥲");
      console.error(error);
      return;
    }

    onSave(data as Appointment);   // restituisco l’appuntamento aggiornato
    onClose();
  };
  /* ------------------------------------------------------------ */

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-md p-6 w-[90%] max-w-md">
        {/* TAB switch */}
        <div className="flex mb-4 space-x-2">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === "edit"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            Modifica
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === "payment"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            Pagamento
          </button>
        </div>

        {/* EDIT --------------------------------------------------- */}
        {activeTab === "edit" ? (
          <div className="space-y-4">
            {/* campi */}
            {/* ... (tutti i campi invariati) ... */}

            {/* Footer con 3 pulsanti */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300"
              >
                Annulla
              </button>

              {/* 🔸 Bottone ELIMINA */}
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Elimina
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Salva
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT ------------------------------------------------ */
          <PaymentForm appointment={editedAppointment} onClose={onClose} />
        )}
      </div>
    </div>
  );
}