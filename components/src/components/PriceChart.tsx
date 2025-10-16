'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

type Point = { t: string; p: number };

async function fetchPrices(symbol: string): Promise<Point[]> {
  // TODO: gerçek API bağla; şimdilik mock
  // örnek 30 nokta
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => {
    const t = new Date(now - (29 - i) * 3600_000).toISOString().slice(11,16);
    const base = 100; // dummy fiyat
    const p = +(base + Math.sin(i/4)*3 + (Math.random()-0.5)*2).toFixed(2);
    return { t, p };
  });
}

export default function PriceChart({ symbol }: { symbol: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['prices', symbol],
    queryFn: () => fetchPrices(symbol),
    staleTime: 30_000
  });

  if (isLoading) return <div className="text-neutral-400">Loading chart…</div>;

  return (
    <div className="h-64 w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="t" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12 }} />
          <Line type="monotone" dataKey="p" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
