import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Clock,
  User,
  Edit,
  Trash2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AvailabilityExceptionFormModal from '../components/staff/AvailabilityExceptionFormModal';
import { useAuth } from '../components/auth/AuthContext';
import { toLocalFromUTC } from '../lib/timeUtils';

interface AvailabilityException {
  id: string;
  barber_id: string;
  exception_start: string; // UTC timestamp
  exception_end: string;   // UTC timestamp
  type: 'open' | 'closed';
  business_id: string;
  barber?: {
    id?: string;
    name: string | null;
  } | null;
}

interface Barber {
  id: string;
  name: string;
  business_id: string;
}

const ClosingExceptions = () => {
  const { profile, loading: authLoading } = useAuth();
  const businessId = profile?.business_id || null;
  const businessTimezone = 'Europe/Rome'; // TODO: fetch from business table

  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedException, setSelectedException] = useState<AvailabilityException | null>(null);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [editingException, setEditingException] = useState<AvailabilityException | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) {
      setExceptions([]);
      setBarbers([]);
      setSelectedException(null);
      setLoading(false);
      return;
    }
    fetchData();
  }, [authLoading, businessId]);

  const fetchData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      // ✅ Fetch exceptions with the barber relation aliased to "barber"
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('availability_exceptions')
        .select(`
          id,
          barber_id,
          exception_start,
          exception_end,
          type,
          business_id,
          barber:barbers (
            id,
            name
          )
        `)
        .eq('business_id', businessId)
        .eq('type', 'closed')
        .order('exception_start', { ascending: false });

      if (exceptionsError) {
        console.error('Error fetching exceptions:', exceptionsError);
        setExceptions([]);
      } else {
        setExceptions((exceptionsData as AvailabilityException[]) || []);
      }

      // Fetch barbers for the modal select
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id,name,business_id')
        .eq('business_id', businessId);

      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
        setBarbers([]);
      } else {
        setBarbers((barbersData as Barber[]) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (exception: AvailabilityException) => {
    setSelectedException(exception);
  };

  const handleEdit = () => {
    if (selectedException) {
      setEditingException(selectedException);
      setIsExceptionModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedException) return;
    if (window.confirm('Sei sicuro di voler eliminare questa eccezione?')) {
      const { error } = await supabase
        .from('availability_exceptions')
        .delete()
        .eq('id', selectedException.id);

      if (error) {
        console.error('Error deleting exception:', error);
        alert("Errore durante l'eliminazione dell'eccezione.");
      } else {
        setSelectedException(null);
        fetchData();
      }
    }
  };

  const handleModalSave = () => {
    setIsExceptionModalOpen(false);
    setEditingException(null);
    fetchData();
  };

  const handleModalClose = () => {
    setIsExceptionModalOpen(false);
    setEditingException(null);
  };

  const filteredExceptions = exceptions.filter(exception => {
    const barberName = exception.barber?.name || '';
    const searchLower = searchQuery.toLowerCase();

    const localStart = toLocalFromUTC({
      utcString: exception.exception_start,
      timezone: businessTimezone,
    });
    const localDate = localStart.toFormat('yyyy-MM-dd');

    return barberName.toLowerCase().includes(searchLower) || localDate.includes(searchQuery);
  });

  const formatDate = (utcString: string) => {
    const localTime = toLocalFromUTC({ utcString, timezone: businessTimezone });
    return localTime.toFormat('cccc, d LLLL yyyy');
  };

  const formatTime = (utcString: string) => {
    const localTime = toLocalFromUTC({ utcString, timezone: businessTimezone });
    return localTime.toFormat('HH:mm');
  };

  const formatTimeRange = (startUtc: string, endUtc: string) => {
    const startLocal = toLocalFromUTC({ utcString: startUtc, timezone: businessTimezone });
    const endLocal = toLocalFromUTC({ utcString: endUtc, timezone: businessTimezone });
    return `${startLocal.toFormat('HH:mm')} - ${endLocal.toFormat('HH:mm')}`;
  };

  // Auth/profile guard UIs
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Verifica autenticazione…</p>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-600">
            Profilo non configurato oppure nessun <code>business_id</code> associato.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Contatta l'amministratore per associare il tuo account a un business.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Eccezioni di Disponibilità</h1>
          <p className="text-gray-600">Gestisci i blocchi dell'agenda per il team</p>
        </div>
        <button
          onClick={() => setIsExceptionModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
          disabled={!businessId}
          title={!businessId ? 'Profilo non configurato (business non collegato)' : undefined}
        >
          <Plus size={18} className="mr-2" />
          Nuova Eccezione
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exceptions list */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca eccezioni"
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Caricamento eccezioni...</div>
            ) : filteredExceptions.length > 0 ? (
              filteredExceptions.map((exception) => (
                <div
                  key={exception.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedException?.id === exception.id ? 'bg-gray-50 border-l-4 border-black' : ''
                  }`}
                  onClick={() => handleSelect(exception)}
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Calendar size={20} className="text-red-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-black">
                        {exception.barber?.name || 'Barbiere sconosciuto'}
                      </h3>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(exception.exception_start)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Clock size={12} className="mr-1" />
                        {formatTimeRange(exception.exception_start, exception.exception_end)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-sm text-gray-500">
                {searchQuery ? 'Nessuna eccezione trovata per la ricerca.' : 'Nessuna eccezione trovata.'}
              </div>
            )}
          </div>
        </div>

        {/* Exception details */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {selectedException ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                    <Calendar size={32} className="text-red-600" />
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-black">Eccezione di Disponibilità</h2>
                    <p className="text-gray-600 mt-1">{selectedException.barber?.name || 'Barbiere sconosciuto'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleEdit}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Dettagli Blocco</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{selectedException.barber?.name || 'Barbiere sconosciuto'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{formatDate(selectedException.exception_start)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">
                        {formatTimeRange(selectedException.exception_start, selectedException.exception_end)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informazioni</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-sm text-red-800 font-medium">Blocco Attivo</p>
                      <p className="text-xs text-red-600 mt-1">
                        Durante questo periodo, il barbiere non sarà disponibile per nuovi appuntamenti.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500">
              <Calendar size={48} className="mb-4" />
              <p>Seleziona un'eccezione per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>

      {/* Exception Form Modal */}
      {isExceptionModalOpen && (
        <AvailabilityExceptionFormModal
          isOpen={isExceptionModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          barbers={barbers}
          businessId={businessId}
          businessTimezone={businessTimezone}
          exceptionType="closed"
          defaultValues={editingException}
        />
      )}
    </div>
  );
};

export default ClosingExceptions;