// src/superadmin/SuperAdmin.tsx
import React from "react";

const SuperAdmin: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white shadow rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-black mb-2">Super Admin Panel</h1>
        <p className="text-gray-600 mb-6">
          Benvenuto nel pannello Super Admin.  
          Da qui potrai gestire tutti i business e le funzionalità globali.
        </p>

        <div className="border-t pt-4">
          <p className="text-gray-700 font-medium mb-2">Business Selector</p>
          {/* ⬇️ Qui useremo BusinessSelector più avanti */}
          <div className="border border-dashed border-gray-300 p-4 rounded-lg text-gray-500">
            [Placeholder: qui comparirà il Business Selector]
          </div>
        </div>

        <div className="border-t mt-6 pt-4">
          <p className="text-gray-700 font-medium mb-2">
            Funzionalità Super Admin
          </p>
          <div className="border border-dashed border-gray-300 p-4 rounded-lg text-gray-500">
            [Placeholder: qui andranno le funzionalità globali (es. inviti, gestione business)]
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;