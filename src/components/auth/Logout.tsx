// src/components/auth/Logout.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Errore durante il logout:', error.message);
      return;
    }
    navigate('/login'); // redirect to login page after logout
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200"
    >
      <LogOut size={20} className="mr-3" />
      <span>Logout</span>
    </button>
  );
};

export default Logout;