// src/components/staff/NewStaffModal.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

interface NewStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (newStaff: any) => void;
}

const NewStaffModal: React.FC<NewStaffModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('barbers')
      .insert([{ name, email, role }])
      .select()
      .single();

    if (!error && data) {
      onCreated(data);
      onOpenChange(false);
      setName('');
      setEmail('');
      setRole('');
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Membro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Ruolo"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />

          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Salvataggio...' : 'Crea'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewStaffModal;