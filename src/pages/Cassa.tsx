// src/pages/Cassa.tsx
import React, { useEffect, useState } from 'react';
import { Receipt, CreditCard, Banknote, Calendar, Search, FileText, Plus } from 'lucide-react';
import { supabase } from "../lib/supabase";
import SlidingPanelPayment from "../components/payment/SlidingPanelPayment"; // ✅ NEW

const groupTransactionsByDate = (transactions) => {
  return transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});
};

const getRomeTimeParts = (date) => {
  const formatter = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
};

const getRomeDateString = (date) => {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Rome'
  });
  return formatter.format(date); // yyyy-mm-dd
};

const Cassa = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [panelOpen, setPanelOpen] = useState(false); // ✅ New
  const [prefill, setPrefill] = useState({}); // ✅ New

  const openNewTransactionPanel = () => {
    setPrefill({});
    setPanelOpen(true);
  };

  const closePanel = () => setPanelOpen(false);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`id, total, payment_method, completed_at, appointment_id, service_id, appointments (customer_name), services (name)`)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Errore nel fetch delle transazioni:', error);
      return;
    }

    const formatted = data.map(tx => {
      const rawDate = new Date(tx.completed_at);
      return {
        id: tx.id,
        time: getRomeTimeParts(rawDate),
        date: getRomeDateString(rawDate),
        client: tx.appointments?.customer_name || '-',
        service: tx.services?.name || 'Servizio',
        amount: tx.total,
        method: tx.payment_method,
      };
    });

    setTransactions(formatted);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(
    tx =>
      (tx.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.service.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (dateFilter ? tx.date === dateFilter : true)
  );

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const dailyTotal = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const cardTotal = filteredTransactions.filter(tx => tx.method === 'Carta').reduce((sum, tx) => sum + tx.amount, 0);
  const cashTotal = filteredTransactions.filter(tx => tx.method === 'Contanti').reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cassa</h1>
          <p className="text-gray-600">Gestisci transazioni e pagamenti</p>
        </div>
        <button
          onClick={openNewTransactionPanel} // ✅ Now opens the sliding panel
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Nuova Transazione
        </button>
      </div>

      {/* ... dashboard cards and transaction table remain unchanged ... */}

      {/* ✅ SLIDING PANEL RENDERED HERE */}
      <SlidingPanelPayment
        visible={panelOpen}
        onClose={closePanel}
        prefill={prefill}
        onSuccess={() => {
          closePanel();
          fetchTransactions(); // refresh after saving
        }}
      />
    </div>
  );
};

export default Cassa;