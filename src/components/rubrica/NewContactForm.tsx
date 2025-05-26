import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const NewContactForm: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    birthdate: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    const { error } = await supabase.from('contacts').insert({
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email,
      customer_birthdate: form.birthdate || null,
    });

    if (error) {
      setError('Errore nel salvataggio del cliente');
    } else {
      onCreated();
    }

    setSaving(false);
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Nome Completo"
          className="w-full border px-3 py-2 rounded"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Numero di Telefono"
          className="w-full border px-3 py-2 rounded"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email (opzionale)"
          className="w-full border px-3 py-2 rounded"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="date"
          name="birthdate"
          placeholder="Data di Nascita (opzionale)"
          className="w-full border px-3 py-2 rounded"
          value={form.birthdate}
          onChange={handleChange}
        />
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-6 w-full bg-[#5D4037] text-white py-2 rounded hover:bg-[#4E342E] transition"
      >
        {saving ? 'Salvataggio...' : 'Salva Cliente'}
      </button>
    </div>
  );
};

export default NewContactForm;