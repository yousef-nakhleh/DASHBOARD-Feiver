// src/components/treatments/CreateTreatmentModal.tsx

import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function CreateTreatmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(20);
  const [category, setCategory] = useState("");
  const [isPopular, setIsPopular] = useState(false);

  const handleSubmit = async () => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from("services").insert([
      {
        name,
        duration_min: duration,
        price,
        category,
        is_popular: isPopular,
      },
    ]);

    if (!error) {
      onCreated();
    } else {
      alert("Errore durante la creazione.");
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black/30 p-4">
        <Dialog.Panel className="bg-white rounded p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Nuovo Trattamento
          </Dialog.Title>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome"
              className="w-full border p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Durata (min)"
              className="w-full border p-2 rounded"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
            <input
              type="number"
              placeholder="Prezzo (€)"
              className="w-full border p-2 rounded"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
            <input
              type="text"
              placeholder="Categoria"
              className="w-full border p-2 rounded"
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
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-[#5c3b30] text-white hover:bg-[#472c24]"
            >
              Salva
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}