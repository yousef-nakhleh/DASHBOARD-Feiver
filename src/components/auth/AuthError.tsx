import React from "react";
import { useNavigate } from "react-router-dom";

export default function AuthError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold text-gray-900">Link non valido o scaduto</h1>
        <p className="mt-2 text-sm text-gray-600">
          Il collegamento per completare l’accesso non è più valido. Richiedi un nuovo invito o riprova.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:opacity-90"
          >
            Torna al login
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Vai alla home
          </button>
        </div>
      </div>
    </div>
  );
}