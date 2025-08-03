import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";   // 👈  ri-uso l’istanza già pronta

export default function CreateTreatmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName]         = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice]       = useState(20);
  const [category, setCategory] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return alert("Il nome è obbligatorio");

    setSaving(true);
    const { error } = await supabase.from("services").insert([
      {
        name,
        duration_min : duration,
        price,
        category,
        is_popular   : isPopular,
        business_id  : "6ebf5f92-14ff-430e-850c-f147c3dc16f4", // 👈 mesmo business de default
        business_id  : "268e0ae9-c539-471c-b4c2-1663cf598436", // 👈 mesmo business de default
      },
    ]);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Errore durante la creazione.");
      return;
    }

    onCreated();    // ricarica lista in pagina padre
  };

  return (
    <Dialog open onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black/30 p-4">
        <Dialog.Panel className="bg-white rounded p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Nuovo Trattamento
          </Dialog.Title>

          <div className="space-y-4">
            <input
              className="w-full border p-2 rounded"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Durata (min)"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />

            <input
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Prezzo (€)"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />

            <input
              className="w-full border p-2 rounded"
              placeholder="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
              />
              <span>Popolare</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              disabled={saving}
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-[#5c3b30] text-white hover:bg-[#472c24]"
              disabled={saving}
            >
              {saving ? "Salvo…" : "Salva"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}