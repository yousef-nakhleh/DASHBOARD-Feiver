// src/components/staff/NewStaffModal.tsx

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NewStaffModalProps {
  open: boolean;
  onClose: () => void;
  onStaffCreated: () => void;
}

const NewStaffModal: React.FC<NewStaffModalProps> = ({ open, onClose, onStaffCreated }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const { error } = await supabase.from('barbers').insert({
      name,
      role,
      phone,
      email,
      start_date: startDate,
      image
    });

    setLoading(false);
    if (!error) {
      onStaffCreated();
      onClose();
    } else {
      console.error('Errore durante la creazione:', error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo Membro dello Staff</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Ruolo</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Telefono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Data Inizio</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Immagine (URL)</Label>
            <Input value={image} onChange={(e) => setImage(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewStaffModal;
