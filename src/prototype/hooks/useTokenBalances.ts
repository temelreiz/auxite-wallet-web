// src/prototype/hooks/useTokenBalances.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbi, formatUnits, type Address } from "viem";

/** Uygulamada geçen semboller */
export type SymbolT = "AUXG" | "AUXS" | "AUXPT" | "AUXPD";

/** Token satırı tipi */
export type BalRow = {
  symbol: SymbolT;
  balance: string;   // kullanıcıya gösterilecek (formatlanmış)
  raw: bigint;       // ham BigInt
  decimals: number;
  name?: string;
  symbolLabel?: string;
};

/** Kontrat adresleri (örnek/placeholder).
 *  KENDİ oracle/token adreslerinle değiştir.
 */
export const TOKENS: Record<SymbolT, Address> = {
  AUXG: "0x0000000000000000000000000000000000000001",
  AUXS: "0x0000000000000000000000000000000000000002",
  AUXPT: "0x0000000000000000000000000000000000000003",
  AUXPD: "0x0000000000000000000000000000000000000004",
};

/** ERC20 minimal ABI (viem tipleriyle uyumlu) */
export const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
]);

/** Hook: Cüzdan bakiyeleri (multicall ile) */
export function useTokenBalances(pollMs = 12_000) {
  const client = usePublicClient(); // viem PublicClient
  const { address } = useAccount();

  // İlk değerleri sıfırla (BigInt literal yerine BigInt(0))
  const initialRows: BalRow[] = useMemo(
    () => (Object.keys(TOKENS) as SymbolT[]).map((sym) => ({
      symbol: sym,
      balance: "0",
      raw: BigInt(0),
      decimals: 18,
    })),
    []
  );

  const [rows, setRows] = useState<BalRow[]>(initialRows);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchAll() {
    if (!client) return;
    setIsLoading(true);

    try {
      // 1) decimals, symbol, name çağrıları (allowFailure ile)
      const tokenList = Object.values(TOKENS) as Address[];

      const decCalls = tokenList.map((addr) => ({
        address: addr,
        abi: ERC20_ABI,
        functionName: "decimals" as const,
      }));
      const symCalls = tokenList.map((addr) => ({
        address: addr,
        abi: ERC20_ABI,
        functionName: "symbol" as const,
      }));
      const nameCalls = tokenList.map((addr) => ({
        address: addr,
        abi: ERC20_ABI,
        functionName: "name" as const,
      }));

      const [decRes, symRes, nameRes] = await Promise.all([
        client.multicall({ contracts: decCalls, allowFailure: true }),
        client.multicall({ contracts: symCalls, allowFailure: true }),
        client.multicall({ contracts: nameCalls, allowFailure: true }),
      ]);

      // Dizin eşlemesi için: index -> address
      const idxToAddr: Address[] = tokenList;

      // Haritalar
      const decimalsMap = new Map<Address, number>();
      const symbolMap = new Map<Address, string>();
      const nameMap = new Map<Address, string>();

      decRes.forEach((r, i) => {
        const addr = idxToAddr[i];
        const val =
          r.status === "success" && typeof r.result === "number"
            ? r.result
            : 18; // default
        decimalsMap.set(addr, val);
      });

      symRes.forEach((r, i) => {
        const addr = idxToAddr[i];
        const val =
          r.status === "success" && typeof r.result === "string"
            ? r.result
            : (Object.keys(TOKENS) as SymbolT[])[i] ?? "TKN";
        symbolMap.set(addr, val);
      });

      nameRes.forEach((r, i) => {
        const addr = idxToAddr[i];
        const val =
          r.status === "success" && typeof r.result === "string"
            ? r.result
            : symbolMap.get(addr) ?? "Token";
        nameMap.set(addr, val);
      });

      // 2) balanceOf (kullanıcı bağlı değilse 0)
      let balances: bigint[] = tokenList.map(() => BigInt(0));

      if (address) {
        const balCalls = tokenList.map((addr) => ({
          address: addr,
          abi: ERC20_ABI,
          functionName: "balanceOf" as const,
          args: [address as Address],
        }));

        const balRes = await client.multicall({
          contracts: balCalls,
          allowFailure: true,
        });

        balances = balRes.map((r) =>
          r.status === "success" ? (r.result as bigint) : BigInt(0)
        );
      }

      // 3) Sonuçları SymbolT sırasıyla topla
      const next: BalRow[] = (Object.keys(TOKENS) as SymbolT[]).map(
        (sym, i) => {
          const addr = TOKENS[sym];
          const dec = decimalsMap.get(addr) ?? 18;
          const raw = balances[i] ?? BigInt(0);
          const pretty = formatUnits(raw, dec);
          return {
            symbol: sym,
            balance: pretty,
            raw,
            decimals: dec,
            name: nameMap.get(addr),
            symbolLabel: symbolMap.get(addr),
          };
        }
      );

      setRows(next);
    } catch (err) {
      console.error("[useTokenBalances] fetchAll error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // İlk yükleme + adres değişiminde tekrar çek
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, address]);

  // Polling
  useEffect(() => {
    if (!pollMs) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchAll, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs, client, address]);

  return {
    rows,
    isLoading,
    refetch: fetchAll,
  };
}
