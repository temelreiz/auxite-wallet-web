import MiniSparkline from './MiniSparkline';

type Props = {
  metal: 'Gold' | 'Silver' | 'Platinum' | 'Palladium';
  symbol: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  price: string;         // "$75.145"
  change: string;        // "+0.124 (0.17%)"
  changeDir: 'up' | 'down' | 'flat';
  bid: string;           // "$75.070"
  spark: number[];       // 20-40 nokta
  color: string;         // çizgi rengi
};

export default function TokenCard(props: Props) {
  const arrow = props.changeDir === 'up' ? '↑' : props.changeDir === 'down' ? '↓' : '→';
  const changeColor =
    props.changeDir === 'up' ? 'text-emerald-600' :
    props.changeDir === 'down' ? 'text-rose-600' :
    'text-neutral-500';

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-4 w-full">
      <div className="text-sm text-neutral-500">{props.metal}</div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold">{props.symbol}</div>
        <div className="text-right">
          <div className="font-bold">${props.price} <span className="text-neutral-500">{arrow}</span></div>
          <div className={`text-sm ${changeColor}`}>{props.change}</div>
          <div className="text-xs text-neutral-500">Bid: {props.bid}<br/>USDT / gram</div>
        </div>
      </div>

      <div className="mt-3">
        <MiniSparkline data={props.spark} color={props.color} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <a className="rounded-xl bg-emerald-600 text-white py-2 grid place-items-center hover:bg-emerald-500" href="/trade">Buy</a>
        <a className="rounded-xl bg-rose-600 text-white py-2 grid place-items-center hover:bg-rose-500" href="/trade">Sell</a>
      </div>
    </div>
  );
}
