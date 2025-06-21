import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY! 
);

type Treatment = {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  category: string;
  is_popular: boolean;
};

type Props = {
  treatment: Treatment;
  onClose: () => void;
  onSave: () => void;
};

export default function EditTreatmentModal({ treatment, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<Treatment>(treatment);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(treatment);
  }, [treatment]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("services")
      .update({
        name: formData.name,
        duration_min: Number(formData.duration_min),
        price: Number(formData.price),
        category: formData.category,
        is_popular: formData.is_popular,
      })
      .eq("id", formData.id);

    setLoading(false);

    if (!error) onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Modifica Trattamento</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Durata (minuti)</label>
            <input
              type="number"
              name="duration_min"
              value={formData.duration_min}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Prezzo (€)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Categoria</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_popular"
              checked={formData.is_popular}
              onChange={handleChange}
            />
            <label className="text-sm">Popolare</label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[#5c3b30] text-white rounded hover:bg-[#472c24]"
          >
            {loading ? "Salvataggio..." : "Salva modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}