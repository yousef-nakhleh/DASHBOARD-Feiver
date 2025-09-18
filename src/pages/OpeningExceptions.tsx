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
import { useSelectedBusiness } from '../components/auth/SelectedBusinessProvider';
import { useBusinessTimezone } from '../hooks/useBusinessTimezone';   // ⬅️ NEW
import { toLocalFromUTC, toUTCFromLocal } from '../lib/timeUtils';

interface AvailabilityException {
  id: string;
  barber_id: string;
  exception_start: string; // UTC timestamp
  exception_end: string;   // UTC timestamp
  type: 'open' | 'closed';
  business_id: string;
  barber?: {
    name: string;
  };
}

interface Barber {
  id: string;
  name: string;
  business_id: string;
}

const OpeningExceptions = () => {
  const { profile, loading: authLoading } = useAuth();
  const { effectiveBusinessId } = useSelectedBusiness();
  const businessId = effectiveBusinessId || null;

  const businessTimezone = useBusinessTimezone(businessId);            // ⬅️ REPLACED

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
            name
          )
        `)
        .eq('business_id', businessId)
        .eq('type', 'open')
        .order('exception_start', { ascending: false });

      if (exceptionsError) {
        console.error('Error fetching exceptions:', exceptionsError);
        setExceptions([]);
      } else {
        setExceptions(exceptionsData || []);
      }

      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .eq('business_id', businessId);

      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
        setBarbers([]);
      } else {
        setBarbers(barbersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`availability-exceptions-open-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_exceptions',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

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
    
    if (window.confirm('Sei sicuro di voler eliminare questa apertura eccezionale?')) {
      const { error } = await supabase
        .from('availability_exceptions')
        .delete()
        .eq('id', selectedException.id);

      if (error) {
        console.error('Error deleting exception:', error);
        alert('Errore durante l\'eliminazione dell\'apertura eccezionale.');
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
    
    return barberName.toLowerCase().includes(searchLower) ||
           localDate.includes(searchQuery);
  });

  const formatDate = (utcString: string) => {
    const localTime = toLocalFromUTC({
      utcString,
      timezone: businessTimezone,
    });
    return localTime.toFormat('cccc, d LLLL yyyy');
  };

  const formatTime = (utcString: string) => {
    const localTime = toLocalFromUTC({
      utcString,
      timezone: businessTimezone,
    });
    return localTime.toFormat('HH:mm');
  };

  const formatTimeRange = (startUtc: string, endUtc: string) => {
    const startLocal = toLocalFromUTC({
      utcString: startUtc,
      timezone: businessTimezone,
    });
    const endLocal = toLocalFromUTC({
      utcString: endUtc,
      timezone: businessTimezone,
    });
    return `${startLocal.toFormat('HH:mm')} - ${endLocal.toFormat('HH:mm')}`;
  };

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
          <h1 className="text-3xl font-bold text-black mb-2">Aperture Eccezionali</h1>
          <p className="text-gray-600">Gestisci le aperture straordinarie del salone</p>
        </div>
        <button
          onClick={() => setIsExceptionModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium"
          disabled={!businessId}
          title={!businessId ? 'Profilo non configurato (business non collegato)' : undefined}
        >
          <Plus size={18} className="mr-2" />
          Nuova Apertura
        </button>
      </div>

      {/* rest of component unchanged */}
      {isExceptionModalOpen && (
        <AvailabilityExceptionFormModal
          isOpen={isExceptionModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          barbers={barbers}
          businessId={businessId}
          businessTimezone={businessTimezone}
          exceptionType="open"
          defaultValues={editingException}
        />
      )}
    </div>
  );
};

export default OpeningExceptions;