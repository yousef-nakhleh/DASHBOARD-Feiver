// src/components/staff/EditStaffAvailabilityModal.tsx
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

/* -------------------------------------------------- */
const daysOfWeek = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];
type Slot = { start_time: string; end_time: string };
type Day  = { weekday: string; enabled: boolean; slots: Slot[] };
type Props = {
  barberId: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

const emptySlot: Slot = { start_time: "", end_time: "" };
const defaultState: Day[] = daysOfWeek.map(d => ({
  weekday: d,
  enabled : false,
  slots   : [{ ...emptySlot }],
}));

/* -------------------------------------------------- */
/* compact <select> dei quarti d’ora */
const TimeSelect = ({
  value, onChange, disabled,
}: {
  value: string; onChange: (v:string)=>void; disabled?: boolean;
}) => {
  const opts = useMemo(() => {
    const arr: { value:string; label:string }[] = [];
    for (let h=6; h<=21; h++) {
      for (let m=0; m<60; m+=15) {
        const d   = new Date();  d.setHours(h, m, 0);
        const val = d.toTimeString().slice(0,5);            // 08:15
        const lab = d.toLocaleTimeString("it-IT",{ hour:"numeric", minute:"2-digit", hour12:true });
        arr.push({ value: val, label: lab });
      }
    }
    return arr;
  }, []);
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-24 rounded border px-2 py-1 text-sm disabled:opacity-40"
    >
      <option value="">--</option>
      {opts.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
};

/* -------------------------------------------------- */
export default function EditStaffAvailabilityModal({
  barberId, open, onClose, onUpdated,
}: Props) {
  const [loading , setLoading ] = useState(false);
  const [state   , setState   ] = useState<Day[]>(defaultState);

  /* load esistente */
  useEffect(() => {
    if (!barberId) return;
    (async () => {
      const { data } = await supabase
        .from("barbers_availabilities")
        .select("*")
        .eq("barber_id", barberId);
      if (!data) return;
      setState(daysOfWeek.map(day => {
        const slots = data.filter(s => s.weekday === day);
        return { weekday: day, enabled: !!slots.length, slots: slots.length? slots : [{...emptySlot}] };
      }));
    })();
  }, [barberId]);

  /* helper mutazioni locali ----------------------------------------------- */
  const toggleDay = (i:number,v:boolean)=>
    setState(prev => prev.map((d,idx)=> idx===i? {...d,enabled:v}:d));

  const updateSlot = (dIdx:number,sIdx:number,k:keyof Slot,val:string)=> setState(prev =>
    prev.map((d,di)=> di!==dIdx? d : {
      ...d,
      slots: d.slots.map((s,si)=> si===sIdx? {...s,[k]:val}:s)
    })
  );

  const addSlot    = (dIdx:number)=> setState(p=>p.map((d,i)=> i===dIdx? {...d,slots:[...d.slots,{...emptySlot}]}:d));
  const removeSlot = (dIdx:number,sIdx:number)=> setState(p=>p.map((d,i)=> i===dIdx? {
    ...d,
    slots: d.slots.filter((_,j)=>j!==sIdx) || [{...emptySlot}],
  }:d));

  /* salva ------------------------------------------------------------------ */
  const handleSave = async () => {
    setLoading(true);
    await supabase.from("barbers_availabilities").delete().eq("barber_id", barberId);
    const rows = state
      .filter(d => d.enabled)
      .flatMap(d => d.slots.filter(s=>s.start_time&&s.end_time)
        .map(s => ({ barber_id: barberId, weekday:d.weekday, ...s })));
    if (rows.length) await supabase.from("barbers_availabilities").insert(rows);
    setLoading(false);
    onUpdated();
  };

  /* -------------------------------------------------- UI */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[540px] px-6 py-5">
        <DialogHeader><DialogTitle className="text-lg">Modifica Disponibilità</DialogTitle></DialogHeader>

        <div className="space-y-3">
          {state.map((d,dIdx)=>(
            <div key={d.weekday} className="flex items-center gap-4">
              {/* colonna A: toggle + label fissi ------------------------------ */}
              <div className="flex items-center gap-3 w-32">
                <Switch checked={d.enabled} onCheckedChange={v=>toggleDay(dIdx,v)} />
                <span className="text-sm">{d.weekday}</span>
              </div>

              {/* colonna B-C-D: slot/i ---------------------------------------- */}
              <div className="flex flex-col gap-2 flex-1">
                {d.slots.map((s,sIdx)=>(
                  <div key={sIdx} className="flex items-center gap-2">
                    <TimeSelect
                      value={s.start_time}
                      disabled={!d.enabled}
                      onChange={v=>updateSlot(dIdx,sIdx,"start_time",v)}
                    />
                    <span className="w-2 text-center">–</span>
                    <TimeSelect
                      value={s.end_time}
                      disabled={!d.enabled}
                      onChange={v=>updateSlot(dIdx,sIdx,"end_time",v)}
                    />

                    {/* quarta colonna FISSA: bottone / placeholder ------------ */}
                    {d.enabled ? (
                      sIdx===d.slots.length-1 ? (
                        <button onClick={()=>addSlot(dIdx)} className="p-1 text-gray-500 hover:text-black">
                          <Plus size={14}/>
                        </button>
                      ):(
                        <button onClick={()=>removeSlot(dIdx,sIdx)} className="p-1 text-gray-400 hover:text-red-500">
                          <X size={14}/>
                        </button>
                      )
                    ) : (
                      <span className="inline-block w-5" />  {/* placeholder invisibile */}
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
          {loading ? "Salvataggio..." : "Salva disponibilità"}
        </button>
      </DialogContent>
    </Dialog>
  );
} 