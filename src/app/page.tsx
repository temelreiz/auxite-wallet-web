"use client";
import dynamic from "next/dynamic";

// DOSYA ADINI birebir doğru yaz:
const Prototype = dynamic(() => import("@/prototype/AuxiteWalletPrototype"), { ssr: false });

export default function Page() {
  return <Prototype />;
}
