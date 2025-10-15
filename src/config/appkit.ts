// src/config/appkit.ts
import { mainnet, sepolia } from 'wagmi/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;
const SEP_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const MAIN_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

// 🔑 Yeni API: wagmiConfig PARAMETRESİ YOK.
// Özel RPC'leri customRpcUrls ile veriyoruz.
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [sepolia, mainnet],
  // opsiyonel - özel RPC'ler:
  customRpcUrls: {
    ...(SEP_RPC
      ? { [sepolia.id]: { http: [SEP_RPC] } }
      : {}),
    ...(MAIN_RPC
      ? { [mainnet.id]: { http: [MAIN_RPC] } }
      : {}),
  },
});

// Not: Adapter, içerde kendi wagmiConfig'ini üretir.
// providers.tsx içinde wagmiAdapter.wagmiConfig'ı kullanmaya devam edebilirsin.
