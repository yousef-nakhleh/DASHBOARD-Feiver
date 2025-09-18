// src/pages/PhoneCaller.tsx
import React, { useEffect, useState } from 'react';
import { Phone, Clock, CheckCircle, XCircle, FileText, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';
import { useSelectedBusiness } from '../components/auth/SelectedBusinessProvider'; // ✅ NEW

interface VapiCall {
  id: string;
  phone_number: string;
  source: string;
  duration_sec: number;
  booking_success: boolean;
  transcript: string;
  created_at: string;
}

const PhoneCaller: React.FC = () => {
  const { user, loading: authLoading } = useAuth(); // ✅ changed
  const { effectiveBusinessId } = useSelectedBusiness(); // ✅ new
  const businessId = effectiveBusinessId ?? null; // ✅ scoped

  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookingSuccess, setFilterBookingSuccess] = useState<'all' | 'success' | 'failed'>('all');
  const [selectedCall, setSelectedCall] = useState<VapiCall | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) {
      setCalls([]);
      setLoading(false);
      return;
    }
    fetchVapiCalls(businessId);
  }, [authLoading, businessId]);

  const fetchVapiCalls = async (businessId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_caller')
        .select('*')
        .eq('business_id', businessId) // ✅ scoped
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore nel caricamento delle chiamate Vapi:', error);
        setCalls([]);
      } else {
        setCalls(data || []);
      }
    } catch (error) {
      console.error('Errore nel fetch dei dati:', error);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch =
      (call.phone_number || '').includes(searchQuery) ||
      (call.source || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.transcript || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterBookingSuccess === 'all' ||
      (filterBookingSuccess === 'success' && call.booking_success) ||
      (filterBookingSuccess === 'failed' && !call.booking_success);

    return matchesSearch && matchesFilter;
  });

  const successfulBookings = calls.filter(call => call.booking_success).length;
  const totalCalls = calls.length;
  const averageDuration = totalCalls > 0
    ? Math.round(calls.reduce((sum, call) => sum + call.duration_sec, 0) / totalCalls)
    : 0;

  // ---- Auth / business guards ----
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Verifica autenticazione…</p>
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
          <Phone size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700">Profilo senza business associato.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">AI Phone Caller</h1>
          <p className="text-gray-600">Gestisci le chiamate dell'assistente AI</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-black rounded-xl">
              <Phone className="text-white" size={24} />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Chiamate Totali</h3>
          <p className="text-3xl font-bold text-black">{totalCalls}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="p-3 bg-green-600 rounded-xl">
            <CheckCircle className="text-white" size={24} />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Prenotazioni Riuscite</h3>
          <p className="text-3xl font-bold text-black">{successfulBookings}</p>
          <p className="text-sm text-gray-500 mt-2">
            {totalCalls > 0 ? Math.round((successfulBookings / totalCalls) * 100) : 0}% di successo
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="p-3 bg-red-600 rounded-xl">
            <XCircle className="text-white" size={24} />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Prenotazioni Fallite</h3>
          <p className="text-3xl font-bold text-black">{totalCalls - successfulBookings}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Clock className="text-white" size={24} />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Durata Media</h3>
          <p className="text-3xl font-bold text-black">{formatDuration(averageDuration)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per telefono, fonte o trascrizione"
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filterBookingSuccess}
                onChange={(e) => setFilterBookingSuccess(e.target.value as 'all' | 'success' | 'failed')}
                className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
              >
                <option value="all">Tutte le chiamate</option>
                <option value="success">Solo prenotazioni riuscite</option>
                <option value="failed">Solo prenotazioni fallite</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Phone size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Caricamento chiamate...</p>
              </div>
            </div>
          ) : filteredCalls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center">
                        <Phone size={16} className="mr-2" />
                        Numero di Telefono
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Fonte
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2" />
                        Durata
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Prenotazione
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Data/Ora
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm">
                            <Phone size={16} />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-black">{(call.phone_number) || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{call.source || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{formatDuration(call.duration_sec)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          call.booking_success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {call.booking_success ? 'Riuscita' : 'Fallita'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{formatDateTime(call.created_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Phone size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchQuery || filterBookingSuccess !== 'all'
                    ? 'Nessun risultato trovato'
                    : 'Nessuna chiamata disponibile'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-black">Trascrizione Chiamata</h2>
                <p className="text-sm text-gray-500">{selectedCall.phone_number} - {formatDateTime(selectedCall.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-500">Fonte:</span>
                  <p className="text-black">{selectedCall.source || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Durata:</span>
                  <p className="text-black">{formatDuration(selectedCall.duration_sec)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Prenotazione:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedCall.booking_success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCall.booking_success ? 'Riuscita' : 'Fallita'}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block mb-2">Trascrizione:</span>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed">
                  {selectedCall.transcript || 'Nessuna trascrizione disponibile'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneCaller;