// src/prototype/hooks/useMultiOracleEvents.ts
// -------------------------------------------------------
// Çoklu oracle event dinleyici (ethers v6 + Next 15 uyumlu)
// - Tek WS provider instance'ı (singleton) paylaşır
// - WSS yoksa HTTP'ye düşer (fallback)
// - Her token için farklı event adı/decimals destekler
// - Hata izleme, otomatik cleanup, type-safe listener
//
// Gereken ENV (opsiyonel):
//   NEXT_PUBLIC_SEPOLIA_WSS_URL=wss://...
//   NEXT_PUBLIC_SEPOLIA_RPC_URL=https://...

import { useEffect, useRef } from "react";
import { ethers } from "ethers";

type OracleConfig = {
  /** Sözleşme adresi */
  address: string;
  /** Event adı (örn: "PriceUpdated") */
  eventName?: string;
  /** Fiyat ondalık basamak sayısı (örn: 2, 6, 8, 18) */
  decimals?: number;
  /** UI tarafında ayırt etmek için benzersiz bir anahtar (örn: "AUXG") */
  key: string;
  /** İsteğe bağlı özel ABI (yoksa minimal varsayılan kullanılır) */
  abi?: any;
};

type OnUpdate = (payload: {
  key: string;
  price: number;
  raw: bigint;
  blockNumber?: number;
  txHash?: string;
}) => void;

// --- Minimal Oracle ABI (event imzası standartsa yeterli) ---
const DEFAULT_ORACLE_ABI = [
  // event PriceUpdated(uint256 newPrice);
  "event PriceUpdated(uint256 newPrice)",
];

const WS_SINGLETON: {
  provider?: ethers.WebSocketProvider | ethers.JsonRpcProvider;
} = {};

// Tek bir provider döndür (WS öncelikli, yoksa HTTP)
function getSharedProvider() {
  if (WS_SINGLETON.provider) return WS_SINGLETON.provider;

  try {
    const wss = process.env.NEXT_PUBLIC_SEPOLIA_WSS_URL;
    if (wss) {
      WS_SINGLETON.provider = new ethers.WebSocketProvider(wss);
      return WS_SINGLETON.provider;
    }
  } catch {
    // ignore and fallback
  }
  // HTTP fallback
  const rpc =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
    "https://eth-sepolia.g.alchemy.com/v2/demo";
  WS_SINGLETON.provider = new ethers.JsonRpcProvider(rpc);
  return WS_SINGLETON.provider;
}

/**
 * Çoklu oracle eventlerini dinler ve her güncellemede onUpdate çağrılır.
 * @param configs Token/Oracle konfig dizisi
 * @param onUpdate Tek tek güncelleme callback'i
 */
export function useMultiOracleEvents(
  configs: OracleConfig[],
  onUpdate: OnUpdate
) {
  const listenersRef = useRef<
    Array<{
      contract: ethers.Contract;
      eventName: string;
      handler: (...args: any[]) => void;
    }>
  >([]);

  useEffect(() => {
    if (!configs?.length) return;

    const provider = getSharedProvider();

    // (Opsiyonel) WS bağlantı logları (v6’da field adı değişebilir)
    const wsAny: any =
      (provider as any)?.websocket ?? (provider as any)?._websocket;
    wsAny?.addEventListener?.("open", () =>
      console.log("[WSS] connected (shared)")
    );
    wsAny?.addEventListener?.("close", () =>
      console.log("[WSS] disconnected (shared)")
    );

    // Her config için contract + listener kur
    for (const cfg of configs) {
      if (!cfg?.address || !ethers.isAddress(cfg.address)) {
        console.warn("[Oracle] Geçersiz adres:", cfg);
        continue;
      }
      const abi = cfg.abi ?? DEFAULT_ORACLE_ABI;
      const eventName = cfg.eventName ?? "PriceUpdated";
      const decimals = Number.isFinite(cfg.decimals) ? cfg.decimals! : 2;

      const contract = new ethers.Contract(cfg.address, abi, provider);

      // Standart imza: PriceUpdated(uint256)
      const handler = (...args: any[]) => {
        try {
          // Ethers v6 event arg yapısı: [arg0, arg1, ..., event]
          // Genelde son param "EventLog" objesi olur.
          const eventObj = args[args.length - 1];
          const newPriceRaw: bigint = args[0] as bigint;

          const price = Number(ethers.formatUnits(newPriceRaw, decimals));
          onUpdate({
            key: cfg.key,
            price,
            raw: newPriceRaw,
            blockNumber: eventObj?.blockNumber,
            txHash: eventObj?.transactionHash,
          });
        } catch (err) {
          console.error(`[Oracle:${cfg.key}] handler error`, err);
        }
      };

      contract.on(eventName, handler);

      listenersRef.current.push({
        contract,
        eventName,
        handler,
      });

      console.log(
        `[Oracle:${cfg.key}] listening ${eventName} @ ${cfg.address} (decimals=${decimals})`
      );
    }

    // Cleanup: tüm listenerları kapat; provider shared kalır
    return () => {
      for (const item of listenersRef.current) {
        try {
          item.contract.off(item.eventName, item.handler);
        } catch {}
      }
      listenersRef.current = [];
      // Not: provider destroy etmiyoruz; shared kalması daha stabil (aynı sayfada başka yerlerde de kullanılıyor olabilir)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs)]); // configs değişince yeniden kur
}
