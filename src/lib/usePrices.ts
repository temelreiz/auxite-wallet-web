'use client';
import { useQuery } from '@tanstack/react-query';

export type PriceRow = {
  symbol: 'AUXG'|'AUXS'|'AUXPT'|'AUXPD';
  price: number;
  change: number;      // 24h delta
  changePct: number;   // 24h %
  bid: number;
  series: number[];    // sparkline
};

export function usePrices() {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/prices?symbols=AUXG,AUXS,AUXPT,AUXPD`;
  return useQuery({
    queryKey: ['prices'],
    queryFn: async (): Promise<PriceRow[]> => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('prices fetch failed');
      const json = await res.json();
      // Gerekirse adapter:
      // return json.data.map(...);
      return json;
    },
    refetchInterval: 5000,
  });
}
