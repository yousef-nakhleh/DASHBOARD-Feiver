import { X } from 'lucide-react';
import React from 'react';
import PaymentForm from './PaymentForm';

const SlidingPanelPayment = ({ visible, onClose, prefill, onSuccess, businessId }) => {
  return (
    <>
      {/* Overlay */}
      {visible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Nuova Transazione</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto h-[calc(100%-88px)]">
          <PaymentForm prefill={prefill} onSuccess={onSuccess} businessId={businessId} />
        </div>
      </div>
    </>
  );
};

export default SlidingPanelPayment;