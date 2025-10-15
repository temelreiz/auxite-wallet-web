// src/app/page.tsx
import dynamic from "next/dynamic";

const Prototype = dynamic(() => import("@/prototype/AuxiteWalletPrototype"), {
  ssr: false,
});

export default function Page() {
  return <Prototype />;
}
