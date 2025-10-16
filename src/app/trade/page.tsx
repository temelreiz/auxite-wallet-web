// src/app/trade/page.tsx
'use client';

import Providers from '../providers';
import WalletButton from '@/components/WalletButton';
import { useState } from 'react';

function TradeInner() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trade</h1>
        <WalletButton />
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSide('BUY')}
            className={`px-4 py-2 rounded-xl border ${side === 'BUY' ? 'bg-green-700 border-green-600' : 'bg-neutral-800 border-neutral-700'}`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={`px-4 py-2 rounded-xl border ${side === 'SELL' ? 'bg-red-700 border-red-600' : 'bg-neutral-800 border-neutral-700'}`}
          >
            Sell
          </button>
        </div>

        <label className="block text-sm text-neutral-300">Amount</label>
        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full rounded-xl bg-black border border-neutral-700 px-3 py-2"
          placeholder="0.00"
        />

        <button className="rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-500 transition">
          {side === 'BUY' ? 'Place Buy' : 'Place Sell'}
        </button>
      </div>
    </main>
  );
}

export default function TradePage() {
  return (
    <Providers>
      <TradeInner />
    </Providers>
  );
}
