// src/components/payment/SlidingPanelPayment.tsx
import { X } from 'lucide-react';
import React from 'react';
import PaymentForm from './PaymentForm';

const SlidingPanelPayment = ({ visible, onClose, prefill, onSuccess }) => {
  return (
    <>
      {/* Overlay */}
      {visible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-1/3 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Nuova Transazione</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-64px)]">
          <PaymentForm prefill={prefill} onSuccess={onSuccess} />
        </div>
      </div>
    </>
  );
};

export default SlidingPanelPayment;