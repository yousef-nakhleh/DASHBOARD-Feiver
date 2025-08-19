import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { X } from "lucide-react";

export default function CreateTreatmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();

  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(20);
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return alert("Il nome è obbligatorio");
    if (!profile?.business_id) {
      alert("Profilo non configurato (manca business_id). Contatta l'amministratore.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("services").insert([
      {
        name,
        duration_min: duration,
        price,
        category,
        business_id: profile.business_id, // 👈 dinamico dal profilo
      },
    ]);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Errore durante la creazione.");
      return;
    }

    onCreated();
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <Dialog.Title className="text-2xl font-bold text-black">Nuovo Trattamento</Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-black"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Nome</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">Durata (minuti)</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                placeholder="Durata (min)"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">Prezzo (€)</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                placeholder="Prezzo (€)"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">Categoria</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                placeholder="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              disabled={saving}
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}