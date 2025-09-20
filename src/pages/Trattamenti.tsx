// src/pages/Trattamenti.tsx
import { useEffect, useState, useMemo } from "react";
import { Clock, DollarSign, Edit2, Trash2, Plus, Search, XCircle } from "lucide-react";
import EditTreatmentModal from "@/components/treatments/EditTreatmentModal";
import CreateTreatmentModal from "@/components/treatments/CreateTreatmentModal";
import { Dialog } from "@headlessui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/auth/AuthContext";
import { useSelectedBusiness } from "../components/auth/SelectedBusinessProvider";
import { useBusinessTimezone } from "../hooks/useBusinessTimezone"; // ✅ NEW

const categories = ["Tutti", "Capelli", "Barba", "Combo", "Colore", "Trattamenti"];

type Service = {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  category: string | null;
  is_popular: boolean;
  business_id: string;
  created_at?: string;
};

// 🔵 QUERY + CACHE (in-memory, per business, short TTL)
const SERVICES_CACHE: Record<
  string,
  { data: Service[]; ts: number }
> = {};
const SERVICES_CACHE_TTL_MS = 60_000; // 60s

export default function Trattamenti() {
  const { user, loading: authLoading } = useAuth();
  const { effectiveBusinessId } = useSelectedBusiness(); 
  const businessId = useMemo(() => effectiveBusinessId ?? null, [effectiveBusinessId]);

  const businessTimezone = useBusinessTimezone(); // ✅ FIX: use as plain string, don't pass businessId

  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // 1) Fetch services for this business (now driven by SelectedBusinessProvider)
  useEffect(() => {
    const fetchServices = async () => {
      if (authLoading) return;
      if (!businessId) {
        setServices([]);
        setLoading(false);
        return;
      }

      const cached = SERVICES_CACHE[businessId];
      const now = Date.now();
      if (cached && now - cached.ts < SERVICES_CACHE_TTL_MS) {
        setServices(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Errore nel caricamento dei servizi:", error);
        setServices([]);
      } else {
        const list = (data || []) as Service[];
        setServices(list);
        SERVICES_CACHE[businessId] = { data: list, ts: now };
      }
      setLoading(false);
    };

    fetchServices();
  }, [businessId, authLoading]);

  // 2) Local filtering
  useEffect(() => {
    let result = services;

    if (selectedCategory !== "Tutti") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [selectedCategory, services, searchQuery]);

  async function refetchServices() {
    if (!businessId) return;
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const list = data as Service[];
      setServices(list);
      SERVICES_CACHE[businessId] = { data: list, ts: Date.now() };
    }
  }

  async function handleConfirmDelete(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (businessId && SERVICES_CACHE[businessId]) {
        SERVICES_CACHE[businessId] = {
          data: SERVICES_CACHE[businessId].data.filter((s) => s.id !== id),
          ts: Date.now(),
        };
      }
    } else {
      alert("Errore durante l'eliminazione.");
    }
  }

  const formatDuration = (minutes: number): string => `${minutes} min`;

  const successfulBookings = 0;
  const totalCalls = services.length;
  const averageDuration =
    totalCalls > 0
      ? Math.round(
          services.reduce((sum, s) => sum + (s.duration_min || 0), 0) / totalCalls
        )
      : 0;

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600">Caricamento autenticazione…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600">Non autenticato.</p>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <XCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-gray-700">
            Profilo senza business associato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Trattamenti</h1>
          <p className="text-gray-600">Gestisci servizi e prezzi</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus size={18} className="mr-2" />
          Nuovo Trattamento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cerca trattamento"
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trattamento
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durata
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prezzo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!loading ? filtered : services).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-black">{s.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-700">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      {formatDuration(s.duration_min)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      €{s.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {s.category || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditing(s)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setToDelete(s)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchQuery
                        ? "Nessun trattamento trovato per la ricerca"
                        : "Nessun trattamento trovato"}
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">Caricamento trattamenti…</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTreatmentModal
        isOpen={!!editing}
        defaultValues={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSave={async () => {
          await refetchServices();
          setEditing(null);
        }}
      />

      {/* Confirm Delete Modal */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <Dialog.Title className="text-xl font-bold text-black mb-4">
              Conferma eliminazione
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo trattamento?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setToDelete(null)}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  if (toDelete) await handleConfirmDelete(toDelete.id);
                  setToDelete(null);
                }}
                className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
              >
                Elimina
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Create Treatment Modal */}
      {creating && (
        <CreateTreatmentModal
          onClose={() => setCreating(false)}
          onCreated={async () => {
            await refetchServices();
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}