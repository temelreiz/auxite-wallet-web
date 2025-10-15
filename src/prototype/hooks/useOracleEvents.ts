// src/prototype/hooks/useOracleEvents.ts
import { useEffect } from "react";
import { ethers } from "ethers";

/** Metal kodları: XAU (Gold), XAG (Silver), XPT (Platinum), XPD (Palladium) */
export type MetalCode = "XAU" | "XAG" | "XPT" | "XPD";

/** Minimal oracle ABI (event imzası) */
const ORACLE_ABI = [
  // event PriceUpdated(uint256 newPrice)
  "event PriceUpdated(uint256 newPrice)",
];

/**
 * Belirtilen oracle sözleşmesindeki PriceUpdated event’ini dinler.
 * @param oracleAddress EVM sözleşme adresi
 * @param onPriceUpdate Fiyat güncellemesi geldiğinde çağrılır (Number)
 */
export function useOracleEvents(
  oracleAddress: string | undefined,
  onPriceUpdate?: (newPrice: number) => void
) {
  useEffect(() => {
    if (!oracleAddress) return;

    let provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;

    try {
      provider = new ethers.WebSocketProvider(
        process.env.NEXT_PUBLIC_SEPOLIA_WSS_URL ??
          "wss://eth-sepolia.g.alchemy.com/v2/demo"
      );
    } catch {
      provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
          "https://eth-sepolia.g.alchemy.com/v2/demo"
      );
    }

    const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);

    const listener = (newPrice: bigint, ev?: any) => {
      // Not: decimals projenizdeki event formatına göre ayarlanmalı (şimdilik 2)
      const formatted = Number(ethers.formatUnits(newPrice, 2));
      // console.debug(`[Oracle] ${oracleAddress} -> ${formatted}`, ev?.transactionHash);
      onPriceUpdate?.(formatted);
    };

    oracle.on("PriceUpdated", listener);

    // (opsiyonel) WSS bağlantı logları
    const ws: any =
      (provider as any)?.websocket ?? (provider as any)?._websocket;
    ws?.addEventListener?.("open", () => console.log("[WSS] connected"));
    ws?.addEventListener?.("close", () => console.log("[WSS] disconnected"));

    return () => {
      oracle.off("PriceUpdated", listener);
      try {
        (provider as any)?.destroy?.();
      } catch {}
    };
  }, [oracleAddress, onPriceUpdate]);
}
