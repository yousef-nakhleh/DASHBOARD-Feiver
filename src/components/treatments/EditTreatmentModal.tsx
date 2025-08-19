import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { X } from "lucide-react";
import { useEffect } from "react";

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  defaultValues?: {
    id?: string;
    name: string;
    price: number;
    duration_min: number;
    category: string;
  };
};

export default function EditTreatmentModal({ isOpen, onClose, onSave, defaultValues }: Props) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [price, setPrice] = useState(defaultValues?.price ?? 0);
  const [duration, setDuration] = useState(defaultValues?.duration_min ?? 0);
  const [category, setCategory] = useState(defaultValues?.category ?? "");
  const [saving, setSaving] = useState(false);

  // Update form fields when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name ?? "");
      setPrice(defaultValues.price ?? 0);
      setDuration(defaultValues.duration_min ?? 0);
      setCategory(defaultValues.category ?? "");
    }
  }, [defaultValues]);

  const isEditing = !!defaultValues?.id;

  if (!isOpen) return null;

  async function handleSave() {
    if (!name || !price || !duration || !category) {
      alert("Per favore, compila tutti i campi.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("services").upsert({
      id: defaultValues?.id,
      name,
      price,
      duration_min: duration,
      category,
    });

    setSaving(false);
    if (error) {
      console.error(error);
      alert("Errore durante il salvataggio.");
    } else {
      onSave();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">
            {isEditing ? "Modifica trattamento" : "Nuovo trattamento"}
          </h2>
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
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
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
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Categoria</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
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
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Salvataggio..." : (isEditing ? "Aggiorna" : "Salva")}
          </button>
        </div>
      </div>
    </div>
  );
}