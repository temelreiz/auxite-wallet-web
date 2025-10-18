import { create } from "zustand";

export type Side = "BUY" | "SELL";

interface TradePanelState {
  open: boolean;
  symbol?: string;     // Örn: AUXG / AUXS / AUXPT / AUXPD
  side: Side;          // BUY | SELL
  price?: number;      // anlık fiyat (USDT/gram)
  qty: string;         // input değeri (string)

  openTrade: (opts: { symbol: string; side: Side; price?: number }) => void;
  setQty: (qty: string) => void;
  setPrice: (price: number) => void;
  close: () => void;
}

export const useTradePanel = create<TradePanelState>((set) => ({
  open: false,
  symbol: undefined,
  side: "BUY",
  price: undefined,
  qty: "",

  openTrade: ({ symbol, side, price }) =>
    set({ open: true, symbol, side, price }),

  setQty: (qty) => set({ qty }),

  setPrice: (price) => set({ price }),

  close: () => set({ open: false, qty: "" }),
}));
