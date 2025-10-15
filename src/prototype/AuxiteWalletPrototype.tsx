"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import ConnectWalletButton from "@/prototype/components/ConnectWallet";
import { useTokenPrices } from "@/prototype/hooks/useTokenPrices";

/* =======================
   Minimal Inline Icons
   ======================= */
const ArrowUpRight: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className} aria-hidden>↑</span>
);
const ArrowDownRight: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className} aria-hidden>↓</span>
);
const Moon: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className} aria-hidden>🌙</span>
);
const Sun: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className} aria-hidden>☀️</span>
);
const AuxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className} aria-hidden>💎</span>
);

/* =======================
   Types
   ======================= */
type SymbolT = "AUXG" | "AUXS" | "AUXPT" | "AUXPD";
type Side = "BUY" | "SELL";

interface TokenRow {
  symbol: SymbolT;
  name: string;
  price: number;
  prevPrice: number;
  bid?: number;
}

/* =======================
   UI Primitives
   ======================= */
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div
    className={[
      "rounded-2xl border p-4 shadow-lg",
      "border-zinc-200 bg-white",
      "dark:border-zinc-800 dark:bg-zinc-900/50",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const Button: React.FC<
  React.PropsWithChildren<{
    onClick?: () => void;
    variant?: "primary" | "ghost" | "danger";
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit";
  }>
> = ({ onClick, variant = "primary", className = "", disabled, type = "button", children }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={[
      "h-11 rounded-xl px-4 font-medium transition outline-none",
      disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-95",
      variant === "primary"
        ? "bg-emerald-500 text-black"
        : variant === "danger"
        ? "bg-rose-500 text-white"
        : "bg-transparent text-zinc-700 border border-zinc-300 dark:text-zinc-200 dark:border-zinc-700",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

/* =======================
   Theme toggle (DOM-truth)
   ======================= */
const useDarkMode = () => {
  const getInitialFromDOM = () => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  };
  const [dark, setDark] = useState<boolean>(getInitialFromDOM);

  const toggle = () => {
    const root = document.documentElement;
    const willDark = !root.classList.contains("dark");
    if (willDark) {
      root.classList.add("dark");
      try { localStorage.setItem("auxite-theme", "dark"); } catch {}
    } else {
      root.classList.remove("dark");
      try { localStorage.setItem("auxite-theme", "light"); } catch {}
    }
    setDark(willDark);
  };

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("auxite-theme"); } catch {}
      if (saved) return; // kullanıcı tercihi baskın
      const root = document.documentElement;
      if (e.matches) { root.classList.add("dark"); setDark(true); }
      else { root.classList.remove("dark"); setDark(false); }
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return { dark, toggle };
};

/* =======================
   Sparkline (token başına ayrı grafik)
   ======================= */
const TOKEN_COLORS: Record<SymbolT, { line: string; fill: string }> = {
  AUXG: { line: "#f59e0b", fill: "rgba(245, 158, 11, 0.15)" },  // amber
  AUXS: { line: "#9ca3af", fill: "rgba(156, 163, 175, 0.15)" }, // zinc-gri
  AUXPT:{ line: "#60a5fa", fill: "rgba(96, 165, 250, 0.15)" },  // mavi
  AUXPD:{ line: "#34d399", fill: "rgba(52, 211, 153, 0.15)" },  // yeşil
};

const Sparkline: React.FC<{
  symbol: SymbolT;
  data: number[];
  width?: number;
  height?: number;
}> = ({ symbol, data, width = 320, height = 64 }) => {
  const pad = 6;
  const w = width, h = height;

  if (!data || data.length < 2) {
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        <line x1={pad} y1={h/2} x2={w-pad} y2={h/2} stroke="currentColor" opacity="0.12" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1e-9;

  const pts = data.map((v, i) => {
    const x = pad + (i * (w - pad*2)) / (data.length - 1);
    const y = pad + (h - pad*2) * (1 - (v - min) / span);
    return [x, y];
  });

  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const area = `M ${pts[0][0]} ${h-pad} ` + pts.map(p => `L ${p[0]} ${p[1]}`).join(" ") + ` L ${pts[pts.length-1][0]} ${h-pad} Z`;

  const color = TOKEN_COLORS[symbol];

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={area} fill={color.fill} />
      <path d={path} fill="none" stroke={color.line} strokeWidth={2} />
    </svg>
  );
};

/* =======================
   Token Card (her kart kendi grafiğini alır)
   ======================= */
const TokenCard: React.FC<{
  t: TokenRow;
  history: number[];
  onTrade: (sym: SymbolT, side: Side) => void;
}> = ({ t, history, onTrade }) => {
  const up = t.price >= t.prevPrice;
  const diff = useMemo(() => t.price - t.prevPrice, [t.price, t.prevPrice]);
  const pct  = useMemo(() => (t.prevPrice ? (diff / t.prevPrice) * 100 : 0), [diff, t.prevPrice]);

  return (
    <Card>
      {/* Üst bilgi */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">{t.name}</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t.symbol}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            ${t.price.toFixed(3)} {up ? <ArrowUpRight /> : <ArrowDownRight />}
          </div>
          <div className={`text-sm ${up ? "text-emerald-600" : "text-rose-500"}`}>
            {(up ? "+" : "") + diff.toFixed(3)} ({pct.toFixed(2)}%)
          </div>
          {typeof t.bid === "number" && (
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Bid: ${t.bid.toFixed(3)}</div>
          )}
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">USDT / gram</div>
        </div>
      </div>

      {/* KART İÇİ TOKEN GRAFİĞİ */}
      <div className="mt-3">
        <Sparkline symbol={t.symbol} data={history} />
      </div>

      {/* Aksiyonlar */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={() => onTrade(t.symbol, "BUY")}>Buy</Button>
        <Button variant="danger"  onClick={() => onTrade(t.symbol, "SELL")}>Sell</Button>
      </div>
    </Card>
  );
};

/* =======================
   Trade Panel
   ======================= */
const TradePanel: React.FC<{
  selected: SymbolT;
  side: Side;
  price: number;
  bid?: number;
  onClose: () => void;
}> = ({ selected, side, price, bid, onClose }) => {
  const { address } = useAccount();
  const [qty, setQty] = useState<string>("1.000");
  const unit = side === "BUY" ? price : (typeof bid === "number" ? bid : price);

  const total = useMemo(() => {
    const q = parseFloat(qty || "0");
    if (Number.isNaN(q)) return 0;
    return +(q * unit).toFixed(3);
  }, [qty, unit]);

  return (
    <Card className="fixed inset-x-4 bottom-4 z-50 border-emerald-700/40 bg-white/90 backdrop-blur-lg dark:bg-zinc-950/90 md:inset-x-auto md:bottom-6 md:right-6 md:w-[440px]">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {side === "BUY" ? "Buy" : "Sell"} {selected}
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" aria-label="Close">✕</button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={side === "BUY" ? "primary" : "ghost"} onClick={() => null} disabled>Buy</Button>
        <Button variant={side === "SELL" ? "danger"  : "ghost"} onClick={() => null} disabled>Sell</Button>
      </div>

      <div className="mt-4">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">Amount (grams)</label>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0.000"
          className="mt-2 w-full rounded-xl bg-zinc-100 px-3 py-3 text-zinc-900 outline-none ring-1 ring-zinc-300 focus:ring-emerald-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
        />
      </div>

      <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center justify-between">
          <span>Price ({side === "BUY" ? "ask" : "bid"})</span>
          <span className="text-zinc-900 dark:text-zinc-100">${unit.toFixed(3)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Est. total</span>
          <span className="text-zinc-900 dark:text-zinc-100">${total.toFixed(3)}</span>
        </div>
      </div>

      <Button className="mt-4 w-full" disabled={!address}>
        {address ? (side === "BUY" ? "Confirm Purchase" : "Confirm Sell") : "Connect wallet"}
      </Button>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
        * Demo UI — gerçek işlemler (approve/transfer/mint) sonraki adımda eklenecek.
      </p>
    </Card>
  );
};

/* =======================
   Navbar
   ======================= */
const Navbar: React.FC<{
  dark: boolean;
  onToggleTheme: () => void;
  onOpenAlloc: () => void;
}> = ({ dark, onToggleTheme, onOpenAlloc }) => {
  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-emerald-500/40 bg-emerald-500/20">
          <AuxIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Auxite</div>
          <div className="text-lg font-bold">Wallet (Web)</div>
        </div>
      </div>

      <nav className="hidden items-center gap-6 text-sm md:flex">
        <a className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="#">Home</a>
        <a className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="#">Tokens</a>
        <a className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="#">Docs</a>
        <a className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" href="#">Support</a>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onOpenAlloc}>Allocation Check</Button>
        <Button variant="ghost" onClick={onToggleTheme}>
          <span className="mr-2">Theme</span>
          {dark ? <Moon /> : <Sun />}
        </Button>
        <ConnectWalletButton />
      </div>
    </div>
  );
};

/* =======================
   Allocation Checker (stub)
   ======================= */
const AllocationChecker: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [addr, setAddr] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
      <Card className="w-full max-w-xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Allocation Sorgulama</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cüzdan adresi girin (AUXG/S/PT/PD için tahsis kayıtlarını sorgulayın).</p>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="0x..."
          className="mt-3 w-full rounded-xl bg-zinc-100 px-3 py-3 text-zinc-900 outline-none ring-1 ring-zinc-300 focus:ring-emerald-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
        />
        <div className="mt-4 flex gap-2">
          <Button variant="ghost" onClick={() => setAddr("")}>Temizle</Button>
          <Button onClick={() => setResult(addr ? `Demo: ${addr.slice(0, 8)}… için 3 aktif allocation bulundu.` : "Adres giriniz.")}>
            Sorgula
          </Button>
        </div>
        {result && (
          <div className="mt-4 rounded-xl bg-zinc-100 p-3 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">{result}</div>
        )}
      </Card>
    </div>
  );
};

/* =======================
   Main
   ======================= */
export default function AuxiteWalletPrototype() {
  const { dark, toggle } = useDarkMode();
  // useTokenPrices: { rows: TokenRow[], history: Record<SymbolT, number[]> }
  const { rows, history } = useTokenPrices(10_000);
  const [allocOpen, setAllocOpen] = useState(false);
  const [selected, setSelected] = useState<SymbolT | null>(null);
  const [side, setSide] = useState<Side>("BUY");

  const handleTrade = (sym: SymbolT, s: Side) => {
    setSelected(sym);
    setSide(s);
  };

  const sel = selected ? rows.find((t) => t.symbol === selected) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-4 pb-24 pt-6 text-zinc-900 transition-colors duration-300 dark:from-zinc-900 dark:to-black dark:text-zinc-100">
      <Navbar dark={dark} onToggleTheme={toggle} onOpenAlloc={() => setAllocOpen(true)} />

      {/* TOKEN CARDS */}
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rows.map((t) => (
          <TokenCard
            key={t.symbol}
            t={t}
            history={history[t.symbol] || []}  // her kart kendi history’si
            onTrade={handleTrade}
          />
        ))}
      </div>

      {/* TRADE PANEL */}
      {sel && selected && (
        <TradePanel
          selected={selected}
          side={side}
          price={sel.price}
          bid={sel.bid}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ALLOCATION MODAL */}
      <AllocationChecker open={allocOpen} onClose={() => setAllocOpen(false)} />

      {/* FOOTER */}
      <div className="mx-auto mt-10 max-w-6xl text-xs text-zinc-600 dark:text-zinc-500">
        © {new Date().getFullYear()} Auxite — On-chain oracle + anlık WSS/polling grafiklerle.
      </div>
    </div>
  );
}
