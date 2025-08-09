import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Errore durante il logout:", error.message);
      // Optionally show a toast here
    }
    setOpen(false);
    navigate("/login");
  };

  return (
    <>
      {/* This is the button already used in your Layout */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200"
      >
        <LogOut size={20} className="mr-3" />
        <span>Logout</span>
      </button>

      {/* Modal */}
      <ConfirmLogoutModal
        isOpen={open}
        onCancel={() => setOpen(false)}
        onConfirm={doLogout}
      />
    </>
  );
};

export default Logout;