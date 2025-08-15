import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Switch } from '../ui/switch';
import { supabase } from '@/lib/supabase';
import { Plus, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
// UI label (Italiano)  ◀▶  valore per il DB (inglese, lowercase)
const dayMap: Record<string, string> = {
  monday:    'Lunedì',
  tuesday:   'Martedì',
  wednesday: 'Mercoledì',
  thursday:  'Giovedì',
  friday:    'Venerdì',
  saturday:  'Sabato',
  sunday:    'Domenica',
};
const daysOfWeek = Object.keys(dayMap);

type Slot = { id?: number | null; start_time: string; end_time: string };
type Day  = { weekday: string; enabled: boolean; slots: Slot[] };

interface SlotWithDay {
  id: number;
  weekday: string;
  start_time: string;
  end_time: string;
}

interface Props {
  barberId: string;
  businessId: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const emptySlot: Slot = { id: null, start_time: '', end_time: '' };
const defaultState: Day[] = daysOfWeek.map((d) => ({
  weekday: d,
  enabled: false,
  slots: [{ ...emptySlot }],
}));

/* ------------------------------------------------------------------ */
function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const arr: { value: string; label: string }[] = [];
    for (let h = 6; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const d = new Date();
        d.setHours(h, m, 0);
        arr.push({
          value: d.toTimeString().slice(0, 5),
          label: d.toLocaleTimeString('it-IT', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
          }),
        });
      }
    }
    return arr;
  }, []);

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 rounded border px-2 py-1 text-sm disabled:opacity-40"
    >
      <option value="">--</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ */
export default function EditStaffAvailabilityModal({
  barberId,
  businessId,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [state, setState]     = useState<Day[]>(defaultState);
  const [originalAvailability, setOriginalAvailability] = useState<SlotWithDay[]>([]);

  /* carica disponibilità ------------------------------------------------ */
  useEffect(() => {
    if (!barberId || !businessId) return;
    (async () => {
      const { data } = await supabase
        .from('availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('business_id', businessId);

      if (!data) return;

      setOriginalAvailability(data);

      setState(
        daysOfWeek.map((day) => {
          const slots = data.filter((s) => s.weekday === day);
          return {
            weekday: day,
            enabled: !!slots.length,
            slots: slots.length
              ? slots.map((slot) => ({
                  id: slot.id,
                  start_time: slot.start_time.slice(0, 5),
                  end_time: slot.end_time.slice(0, 5),
                }))
              : [{ ...emptySlot }],
          };
        }),
      );
    })();
  }, [barberId, businessId]);

  /* helper mutazioni ---------------------------------------------------- */
  const toggleDay = (idx: number, val: boolean) =>
    setState((p) => p.map((d, i) => {
      if (i !== idx) return d;
      if (val && (d.slots.length === 0 || (d.slots.length === 1 && !d.slots[0].start_time && !d.slots[0].end_time))) {
        return { ...d, enabled: val, slots: [{ start_time: '09:00', end_time: '17:00' }] };
      }
      return { ...d, enabled: val };
    }));

  const updateSlot = (
    dIdx: number,
    sIdx: number,
    field: keyof Slot,
    val: string,
  ) =>
    setState((p) =>
      p.map((d, i) =>
        i !== dIdx
          ? d
          : {
              ...d,
              slots: d.slots.map((s, j) =>
                j === sIdx ? { ...s, [field]: val } : s,
              ),
            },
      ),
    );

  const addSlot = (dIdx: number) =>
    setState((p) =>
      p.map((d, i) =>
        i === dIdx ? { ...d, slots: [...d.slots, { ...emptySlot }] } : d,
      ),
    );

  const removeSlot = (dIdx: number, sIdx: number) =>
    setState((p) =>
      p.map((d, i) =>
        i === dIdx
          ? {
              ...d,
              slots: d.slots.filter((_, j) => j !== sIdx) || [{ ...emptySlot }],
            }
          : d,
      ),
    );

  /* salvataggio diffing ------------------------------------------------- */
  const handleSave = async () => {
    if (!businessId) return;
    setLoading(true);

    const inserts: any[] = [];
    const updates: any[] = [];
    const deletions: number[] = [];

    const newFlat: SlotWithDay[] = [];

    state.forEach((day) => {
      if (!day.enabled) return;

      day.slots.forEach((slot) => {
        if (!slot.start_time || !slot.end_time) return;
        newFlat.push({
          id: slot.id ?? null,
          weekday: day.weekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
        });
      });
    });

    // find deletions (in original but not in new)
    for (const orig of originalAvailability) {
      const stillExists = newFlat.find(
        (s) =>
          s.id === orig.id ||
          (s.weekday === orig.weekday &&
            s.start_time === orig.start_time.slice(0, 5) &&
            s.end_time === orig.end_time.slice(0, 5))
      );
      if (!stillExists) deletions.push(orig.id);
    }

    // find inserts and updates
    for (const slot of newFlat) {
      if (!slot.id) {
        inserts.push({
          business_id: businessId,
          barber_id: barberId,
          weekday: slot.weekday,
          start_time: slot.start_time,
          end_time: slot.end_time,
        });
      } else {
        const orig = originalAvailability.find((s) => s.id === slot.id);
        if (
          orig &&
          (orig.start_time.slice(0, 5) !== slot.start_time ||
            orig.end_time.slice(0, 5) !== slot.end_time)
        ) {
          updates.push({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      }
    }

    const ops: Promise<any>[] = [];

    if (deletions.length) {
      ops.push(supabase.from('availability').delete().in('id', deletions));
    }

    if (inserts.length) {
      ops.push(supabase.from('availability').insert(inserts));
    }

    if (updates.length) {
      for (const upd of updates) {
        ops.push(
          supabase
            .from('availability')
            .update({
              start_time: upd.start_time,
              end_time: upd.end_time,
            })
            .eq('id', upd.id)
        );
      }
    }

    await Promise.all(ops);
    setLoading(false);
    onUpdated();
  };

  /* -------------------------------------------------------------------- */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[540px] px-6 py-5">
        <DialogHeader>
          <DialogTitle className="text-lg">Modifica Disponibilità</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {state.map((d, dIdx) => (
            <div key={d.weekday} className="flex items-center gap-4">
              <div className="flex items-center gap-3 w-32">
                <Switch
                  checked={d.enabled}
                  onCheckedChange={(v) => toggleDay(dIdx, v)}
                />
                <span className="text-sm">{dayMap[d.weekday]}</span>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {d.slots.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2">
                    <TimeSelect
                      value={s.start_time}
                      disabled={!d.enabled}
                      onChange={(v) => updateSlot(dIdx, sIdx, 'start_time', v)}
                    />
                    <span className="w-2 text-center">–</span>
                    <TimeSelect
                      value={s.end_time}
                      disabled={!d.enabled}
                      onChange={(v) => updateSlot(dIdx, sIdx, 'end_time', v)}
                    />
                    {d.enabled ? (
                      sIdx === d.slots.length - 1 ? (
                        <button
                          onClick={() => addSlot(dIdx)}
                          className="p-1 text-gray-500 hover:text-black"
                        >
                          <Plus size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => removeSlot(dIdx, sIdx)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      )
                    ) : (
                      <span className="inline-block w-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full rounded bg-[#1a1a1a] py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Salvataggio…' : 'Salva disponibilità'}
        </button>
      </DialogContent>
    </Dialog>
  );
}