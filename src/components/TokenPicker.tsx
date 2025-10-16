'use client';
import { useState } from 'react';

const TOKENS = [
  { symbol: 'AUXG', name: 'Auxite Gold', address: '0x...' },
  { symbol: 'AUXS', name: 'Auxite Silver', address: '0x...' },
  { symbol: 'AUXPT', name: 'Auxite Platinum', address: '0x...' },
  { symbol: 'AUXPD', name: 'Auxite Palladium', address: '0x...' }
];

export default function TokenPicker({ value, onChange }:{ value:string; onChange:(s:string)=>void }) {
  const [open, setOpen] = useState(false);
  const selected = TOKENS.find(t => t.symbol === value) ?? TOKENS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(v=>!v)} className="w-40 justify-between inline-flex items-center rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2">
        <span>{selected.symbol}</span>
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="m7 10l5 5l5-5z"/></svg>
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-48 rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg">
          {TOKENS.map(t => (
            <button key={t.symbol} onClick={() => { onChange(t.symbol); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-800">
              {t.symbol} — <span className="text-neutral-400">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
