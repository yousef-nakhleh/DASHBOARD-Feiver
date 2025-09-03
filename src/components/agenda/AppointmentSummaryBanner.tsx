// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useMemo } from 'react';
import { X, Check, Trash2, Repeat, Scissors, Printer, ChevronDown } from 'lucide-react';

/**
 * Static floating summary panel.
 * - No fetching, no mutations.
 * - No page overlay/blur.
 * - Meant to be positioned near a clicked appointment.
 */
type AppointmentSummaryButtonProps = {
  /** Absolute position (viewport coords). Defaults place near the top-left if not provided. */
  position?: { top: number; left: number };
  /** Close callback (for wiring later). */
  onClose?: () => void;
};

const AppointmentSummaryButton: React.FC<AppointmentSummaryButtonProps> = ({
  position,
  onClose,
}) => {
  // Default placement (you can pass {top,left} from the clicked card's DOMRect later)
  const style = useMemo<React.CSSProperties>(() => {
    const top = position?.top ?? 120;
    const left = position?.left ?? 460;
    return {
      position: 'absolute',
      top,
      left,
      // Ensure it floats over the grid/cards
      zIndex: 60,
      // Subtle transform to pull it slightly inside the column
      transform: 'translateX(8px)',
    };
  }, [position]);

  return (
    <div
      style={style}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 w-[520px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-black">Riepilogo Prenotazione</h3>
          <p className="text-sm text-gray-500">Dettagli dell’appuntamento</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary confirm/check (static) */}
          <button
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            title="Conferma"
            type="button"
          >
            <Check size={18} />
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition-colors"
            title="Chiudi"
            type="button"
          >
            <X size={18} className="text-black" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Service row */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 truncate">
              Taglio Uomo con Shampoo
            </div>
            <div className="mt-2 grid grid-cols-[72px_1fr] gap-x-4 gap-y-2 text-[13px]">
              <div className="text-gray-500">Con</div>
              <div className="font-medium text-gray-900">Alket</div>

              <div className="text-gray-500">Note</div>
              <div className="text-gray-800 whitespace-pre-line">
                Alban{'\n'}(shampoo){'\n'}Source: Treatwell{'\n'}
                Order Reference: T2157334518{'\n'}
                Booking Reference: bk_142692964
              </div>

              <div className="text-gray-500">Prezzo</div>
              <div className="font-semibold text-gray-900">€ 20,00</div>
            </div>
          </div>

          {/* Duration chip with caret (static) */}
          <button
            type="button"
            className="ml-4 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-900 text-[12px] font-semibold border border-gray-200"
            title="Durata"
          >
            0.30h <ChevronDown size={14} className="opacity-70" />
          </button>
        </div>

        {/* Compact tabs mimic (static / non-interactive) */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black text-white">
            Riepilogo
          </span>
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            Info Cliente
          </span>
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            Cassa
          </span>
        </div>

        {/* Info Cliente preview block (static, as in screenshot #1) */}
        <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
          <div className="text-sm font-semibold text-gray-900 mb-3">Info Cliente</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-1">Nome</div>
              <div className="font-medium text-gray-900">Gabriel</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Cognome</div>
              <div className="font-medium text-gray-900">—</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500 text-xs mb-1">Email</div>
              <div className="font-medium text-gray-900">morminagabriel17@gmail.co</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500 text-xs mb-1">Telefono</div>
              <div className="font-medium text-gray-900">+39 000 000 0000</div>
            </div>
          </div>

          {/* Consent banner like in the screenshot */}
          <div className="mt-3 text-xs font-semibold text-white bg-red-500 rounded-lg px-3 py-2 inline-flex">
            Non ha dato i consensi per la privacy
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="Elimina"
        >
          <Trash2 size={16} />
          <span className="text-sm font-medium">Elimina</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Taglia"
          >
            <Scissors size={16} />
            <span className="text-sm font-medium">Taglia</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Ripeti"
          >
            <Repeat size={16} />
            <span className="text-sm font-medium">Ripeti</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Stampa"
          >
            <Printer size={16} />
            <span className="text-sm font-medium">Stampa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummaryButton;