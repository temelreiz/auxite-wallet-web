"use client";
import React from "react";
import { useAccount } from "wagmi";

export default function ConnectWalletButton({ className = "" }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const short = (a: string) => a.slice(0,6) + "..." + a.slice(-4);

  return (
    <button
      className={`h-11 rounded-xl px-4 font-medium transition bg-emerald-500 text-black hover:scale-[1.01] active:scale-95 ${className}`}
      onClick={() => (window as any).open?.("","_self")} // no-op (Web3Modal’ı global tuş ile açacağız)
      data-w3m-open
    >
      {isConnected && address ? short(address) : "Connect"}
    </button>
  );
}
