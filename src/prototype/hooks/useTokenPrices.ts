// src/prototype/hooks/useTokenPrices.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOracleEvents, type MetalCode } from "./useOracleEvents";

/** UI tarafında kullandığımız semboller */
export type SymbolT = "AUXG" | "AUXS" | "AUXPT" | "AUXPD";

export interface TokenRow {
  symbol: SymbolT;
  name: string;
  price: number;     // anlık fiyat
  prevPrice: number; // bir önceki tick fiyatı
  bid?: number;      // opsiyonel (yay/komisyon simülasyonu)
}

/** Metal -> Token sembol eşlemesi */
const MAP_M2T: Record<MetalCode, SymbolT> = {
  XAU: "AUXG",
  XAG: "AUXS",
  XPT: "AUXPT",
  XPD: "AUXPD",
};

/** Sembolden görünen ad */
const NAMES: Record<SymbolT, string> = {
  AUXG: "Gold",
  AUXS: "Silver",
  AUXPT: "Platinum",
  AUXPD: "Palladium",
};

/** Başlangıç/varsayılan fiyatlar (USDT/gram örnek) */
const DEFAULT_PRICES: Record<SymbolT, number> = {
  AUXG: 75.0,
  AUXS: 1.10,
  AUXPT: 32.0,
  AUXPD: 70.0,
};

/** En fazla kaç nokta tutulsun (grafik için) */
const HISTORY_LIMIT = 120;

/** Ortak yardımcı: history’ye değer ekle (sınırı koru) */
function pushHistory(
  map: Record<SymbolT, number[]>,
  sym: SymbolT,
  value: number,
  limit = HISTORY_LIMIT
) {
  const arr = map[sym] ?? [];
  const next = [...arr, value];
  if (next.length > limit) next.splice(0, next.length - limit);
  map[sym] = next;
}

/**
 * Token fiyatlarını yönetir.
 * - Varsayılan olarak "random walk" ile yumuşak simülasyon yapar (client-only).
 * - Env’de oracle adresleri varsa event tabanlı güncelleme alır:
 *   NEXT_PUBLIC_ORACLE_XAU, NEXT_PUBLIC_ORACLE_XAG, NEXT_PUBLIC_ORACLE_XPT, NEXT_PUBLIC_ORACLE_XPD
 *
 * @param tickMs Simülasyon/polling tick süresi (ms). Örn: 10_000
 */
export function useTokenPrices(tickMs = 10_000) {
  // rows state
  const [rows, setRows] = useState<TokenRow[]>(() =>
    (Object.keys(DEFAULT_PRICES) as SymbolT[]).map((s) => ({
      symbol: s,
      name: NAMES[s],
      price: DEFAULT_PRICES[s],
      prevPrice: DEFAULT_PRICES[s],
      bid: undefined,
    }))
  );

  // history referansı (mutasyon sonra setState)
  const historyRef = useRef<Record<SymbolT, number[]>>({
    AUXG: [DEFAULT_PRICES.AUXG],
    AUXS: [DEFAULT_PRICES.AUXS],
    AUXPT: [DEFAULT_PRICES.AUXPT],
    AUXPD: [DEFAULT_PRICES.AUXPD],
  });

  // rows -> history’yi dışarı verirken stable object üret
  const history = useMemo(() => {
    // referans kopyası (state değil; render için)
    return {
      AUXG: [...(historyRef.current.AUXG ?? [])],
      AUXS: [...(historyRef.current.AUXS ?? [])],
      AUXPT: [...(historyRef.current.AUXPT ?? [])],
      AUXPD: [...(historyRef.current.AUXPD ?? [])],
    } as Record<SymbolT, number[]>;
  }, [rows]); // rows değiştikçe güncellenmiş history döndür

  /** Tek bir sembolün fiyatını güncelle (prev -> price) */
  const applyPrice = useCallback((sym: SymbolT, newPrice: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.symbol === sym
          ? {
              ...r,
              prevPrice: r.price,
              price: Number.isFinite(newPrice) ? newPrice : r.price,
              // basit bir bid simülasyonu (spread ~ %0.1)
              bid: Number.isFinite(newPrice)
                ? +(newPrice * 0.999).toFixed(3)
                : r.bid,
            }
          : r
      )
    );
    pushHistory(historyRef.current, sym, Number.isFinite(newPrice) ? newPrice : 0);
  }, []);

  /** Simülasyon tick’i (event gelmezse küçük bir random walk uygula) */
  const tickSim = useCallback(() => {
    setRows((prev) => {
      const next = prev.map((r) => {
        // +/- %0.25 rastgele hareket
        const drift = 1 + (Math.random() - 0.5) * 0.005;
        const newP = +(r.price * drift);
        pushHistory(historyRef.current, r.symbol, +newP.toFixed(3));
        return {
          ...r,
          prevPrice: r.price,
          price: +newP.toFixed(3),
          bid: +(newP * 0.999).toFixed(3),
        };
      });
      return next;
    });
  }, []);

  // ---- Oracle event bağlantıları (env varsa) ----
  // .env.local:
  // NEXT_PUBLIC_ORACLE_XAU=0x...
  // NEXT_PUBLIC_ORACLE_XAG=0x...
  // NEXT_PUBLIC_ORACLE_XPT=0x...
  // NEXT_PUBLIC_ORACLE_XPD=0x...
  const ORACLES: Partial<Record<MetalCode, string | undefined>> = useMemo(
    () => ({
      XAU: process.env.NEXT_PUBLIC_ORACLE_XAU,
      XAG: process.env.NEXT_PUBLIC_ORACLE_XAG,
      XPT: process.env.NEXT_PUBLIC_ORACLE_XPT,
      XPD: process.env.NEXT_PUBLIC_ORACLE_XPD,
    }),
    []
  );

  // Her metal için ayrı event subscriber kur
  (Object.keys(ORACLES) as MetalCode[]).forEach((m) => {
    const addr = ORACLES[m];
    const sym = MAP_M2T[m];
    // Hook: addr varsa dinle; yoksa no-op
    useOracleEvents(addr, (newP) => applyPrice(sym, +newP.toFixed(3)));
  });

  // Simülasyon timer’ı (event yoksa da fiyat akar)
  useEffect(() => {
    if (!tickMs) return;
    const t = setInterval(tickSim, tickMs);
    return () => clearInterval(t);
  }, [tickMs, tickSim]);

  return { rows, history };
}
