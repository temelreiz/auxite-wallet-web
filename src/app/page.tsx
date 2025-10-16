// src/app/page.tsx
'use client';

import Providers from './providers';
import Header from '@/components/Header';
import TokenCard from '@/components/TokenCard';

const mock = {
  AUXG: { metal: 'Gold',     price: '75.145', change: '+0.124 (0.17%)', dir: 'up',   bid: '$75.070',  color: '#f59e0b' },
  AUXS: { metal: 'Silver',   price: '1.097',  change: '+0.000 (0.00%)', dir: 'flat', bid: '$1.096',   color: '#9ca3af' },
  AUXPT:{ metal: 'Platinum', price: '31.924', change: '-0.066 (-0.21%)',dir: 'down', bid: '$31.892',  color: '#60a5fa' },
  AUXPD:{ metal: 'Palladium',price: '69.429', change: '-0.145 (-0.21%)',dir: 'down', bid: '$69.360',  color: '#34d399' },
} as const;

function fakeSeries(seed = 100) {
  let v = seed;
  return Array.from({ length: 24 }, () => {
    v += (Math.random() - 0.5) * 2;
    return +v.toFixed(2);
  });
}

function HomeInner() {
  return (
    <>
      <Header />
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <TokenCard symbol="AUXG" metal={mock.AUXG.metal} price={mock.AUXG.price}
          change={mock.AUXG.change} changeDir={mock.AUXG.dir as any} bid={mock.AUXG.bid}
          spark={fakeSeries(75)} color={mock.AUXG.color}/>
        <TokenCard symbol="AUXS" metal={mock.AUXS.metal} price={mock.AUXS.price}
          change={mock.AUXS.change} changeDir={mock.AUXS.dir as any} bid={mock.AUXS.bid}
          spark={fakeSeries(1.1)} color={mock.AUXS.color}/>
        <TokenCard symbol="AUXPT" metal={mock.AUXPT.metal} price={mock.AUXPT.price}
          change={mock.AUXPT.change} changeDir={mock.AUXPT.dir as any} bid={mock.AUXPT.bid}
          spark={fakeSeries(32)} color={mock.AUXPT.color}/>
        <TokenCard symbol="AUXPD" metal={mock.AUXPD.metal} price={mock.AUXPD.price}
          change={mock.AUXPD.change} changeDir={mock.AUXPD.dir as any} bid={mock.AUXPD.bid}
          spark={fakeSeries(69)} color={mock.AUXPD.color}/>
      </section>

      <footer className="text-xs text-neutral-500 mt-8">
        © 2025 Auxite — On-chain oracle + anlık WSS/polling grafiklerle.
      </footer>
    </>
  );
}

export default function Page() {
  return (
    <Providers>
      <HomeInner />
    </Providers>
  );
}
