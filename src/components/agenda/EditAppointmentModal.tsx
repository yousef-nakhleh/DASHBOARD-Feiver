// src/components/agenda/EditAppointmentModal.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Appointment } from "@/types";
import PaymentForm from "@/components/payment/PaymentForm";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSave: (a: Appointment) => void;
}

export default function EditAppointmentModal({
  appointment,
  onClose,
  onSave,
}: Props) {
  const [tab, setTab] = useState<"edit" | "payment">("edit");
  const [draft, setDraft] = useState(appointment);

  /* ---------------- Handlers ---------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setDraft((p) => ({ ...p, [name]: name === "duration_min" ? +value : value }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  /* 🔸 NUOVO: segna come “cancellato” */
  const handleDelete = async () => {
    if (!confirm("Cancellare l’appuntamento?")) return;

    const { data, error } = await supabase
      .from("appointments")
      .update({ appointment_status: "cancellato" })
      .eq("id", appointment.id)
      .select()
      .single();

    if (error) {
      alert("Errore durante la cancellazione");
      console.error(error);
      return;
    }

    onSave(data as Appointment);
    onClose();
  };
  /* ----------------------------------------- */

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-md p-6 w-[90%] max-w-md">
        {/* Tabs */}
        <div className="flex mb-4 space-x-2">
          {(["edit", "payment"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                tab === t
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {t === "edit" ? "Modifica" : "Pagamento"}
            </button>
          ))}
        </div>

        {tab === "edit" ? (
          <>
            {/* --- FORM DI MODIFICA (identico al tuo) --- */}
            <div className="space-y-4">
              <Field label="Nome Cliente">
                <input
                  type="text"
                  name="customer_name"
                  value={draft.customer_name}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Servizio">
                <select
                  name="service_name"
                  value={draft.service_name}
                  onChange={handleChange}
                >
                  <option value="Haircut">Haircut</option>
                  <option value="Color">Color</option>
                  <option value="Balayage">Balayage</option>
                </select>
              </Field>

              <Field label="Data">
                <input
                  type="date"
                  name="appointment_date"
                  value={draft.appointment_date}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Orario">
                <input
                  type="time"
                  name="appointment_time"
                  value={draft.appointment_time}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Durata (minuti)">
                <input
                  type="number"
                  name="duration_min"
                  value={draft.duration_min}
                  onChange={handleChange}
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4">
              <Button gray onClick={onClose}>Annulla</Button>
              <Button red  onClick={handleDelete}>Elimina</Button>
              <Button blue onClick={handleSave}>Salva</Button>
            </div>
          </>
        ) : (
          /* --- TAB pagamento --- */
          <PaymentForm appointment={draft} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

/* ---------------- UI helper piccoli ---------------- */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children as any}
    </div>
  );
}

function Button({
  children,
  onClick,
  gray,
  red,
  blue,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  gray?: boolean;
  red?: boolean;
  blue?: boolean;
}) {
  const base = "px-4 py-2 rounded hover:opacity-90";
  const color = gray
    ? "bg-zinc-200 text-zinc-700"
    : red
    ? "bg-red-100 text-red-700"
    : "bg-blue-600 text-white";
  return (
    <button onClick={onClick} className={`${base} ${color}`}>
      {children}
    </button>
  );
}