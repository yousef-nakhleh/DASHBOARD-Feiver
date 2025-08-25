import React, { useEffect, useState, useMemo } from "react";
import { MessageSquare, Search, Phone, Mail, User, FileText, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toLocalFromUTC } from "../lib/timeUtils";
import { useAuth } from "../components/auth/AuthContext";

interface ChatbotData {
  id: string;
  name: string;
  phone: string;
  email: string;
  request: string;
  created_at?: string;
}

const Chatbot: React.FC = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const businessId = useMemo(() => profile?.business_id ?? null, [profile?.business_id]);

  const [data, setData] = useState<ChatbotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const businessTimezone = "Europe/Rome";

  // Fetch Chatbot rows for this business
  useEffect(() => {
    const fetchChatbotData = async () => {
      if (authLoading) return; // wait for auth
      if (!businessId) {
        setData([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: chatbotData, error } = await supabase
          .from("chatbot") // 👈 now fetching from chatbot table
          .select("id, name, phone, email, request, created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Errore nel caricamento dei dati Chatbot:", error);
          setData([]);
        } else {
          const converted = (chatbotData || []).map((item) => ({
            ...item,
            created_at: item.created_at
              ? toLocalFromUTC({ utcString: item.created_at, timezone: businessTimezone }).toISO()
              : undefined,
          }));
          setData(converted);
        }
      } catch (err) {
        console.error("Errore nel fetch dei dati:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatbotData();
  }, [user, businessId, authLoading]);

  const filteredData = data.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone?.includes(searchQuery) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.request?.toLowerCase().includes(searchQuery.toLowerCase())
  );
   

  // Guard states
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
          <p className="text-gray-700">Profilo senza business associato.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Chatbot</h1>
          <p className="text-gray-600">Gestisci le richieste ricevute tramite Chatbot</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome, telefono, email o richiesta"
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Caricamento dati...</p>
              </div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        Nome e Cognome
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center">
                        <Phone size={16} className="mr-2" />
                        Numero di Telefono
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center">
                        <Mail size={16} className="mr-2" />
                        E-mail
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center">
                        <FileText size={16} className="mr-2" />
                        Richiesta
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm">
                            {item.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-black">{item.name || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{item.phone || "N/A"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{item.email || "N/A"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 truncate" title={item.request}>
                            {item.request || "N/A"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "Nessun risultato trovato" : "Nessuna richiesta disponibile"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;