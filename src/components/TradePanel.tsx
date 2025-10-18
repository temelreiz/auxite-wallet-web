"use client";

import { useMemo } from "react";
import { useTradePanel } from "@/store/tradePanel";
import { formatUsd } from "@/lib/pricing";

export default function TradePanel() {
  const { open, symbol, side, qty, price, setQty, close } = useTradePanel();

  const total = useMemo(() => {
    const q = Number(qty || "0");
    if (!price || !q) return 0;
    return q * price;
  }, [qty, price]);

  return (
    <div
      className={`fixed z-50 right-4 bottom-4 w-[360px] rounded-2xl border
        bg-white shadow-lg transition-all duration-200
        ${open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="font-semibold">
          {side} {symbol}
        </div>
        <button
          onClick={close}
          className="text-neutral-500 hover:text-black"
          aria-label="Close trade panel"
        >
          ✕
        </button>
      </div>

      <div className="p-4 grid gap-3">
        <label className="text-sm">
          Quantity (gram)
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="0.0"
            inputMode="decimal"
          />
        </label>

        <div className="text-sm text-neutral-600">
          Price: <span className="font-medium">{price ? formatUsd(price) : "-"}</span>
        </div>
        <div className="text-sm text-neutral-600">
          Estimated Total:{" "}
          <span className="font-semibold">{formatUsd(total || 0)}</span>
        </div>

        <button
          disabled={!qty || !price}
          className={`rounded-xl py-2 text-white font-medium ${
            side === "BUY" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
          } disabled:opacity-50`}
          onClick={() => {
            // TODO: burada on-chain/servis entegrasyonu
            alert(`Order placed: ${side} ${qty} g ${symbol} @ ${price}`);
          }}
        >
          Confirm {side}
        </button>
      </div>
    </div>
  );
}
