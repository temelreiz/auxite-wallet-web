'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState, type Config as WagmiConfig } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { mainnet, sepolia } from '@reown/appkit/networks';

import { wagmiAdapter, projectId } from '@/config/appkit';

// Tek bir QueryClient (HMR’de yeniden yaratmayı önler)
const queryClient =
  (globalThis as any).__AUX_QUERY_CLIENT__ ??
  ((globalThis as any).__AUX_QUERY_CLIENT__ = new QueryClient());

// AppKit modal metadata (opsiyonel)
const metadata = {
  name: 'Auxite Wallet',
  description: 'Auxite on-chain wallet',
  url: 'https://auxite.io',
  icons: ['https://auxite.io/favicon.ico'],
};

// HMR/çoklu importlarda tekrar init olmaması için guard
declare global {
  // eslint-disable-next-line no-var
  var __AUX_APPKIT_INIT__: boolean | undefined;
}

if (!(globalThis as any).__AUX_APPKIT_INIT__) {
  createAppKit({
    adapters: [wagmiAdapter],     // ✅ SADECE adapter
    projectId: projectId!,        // ✅ zorunlu
    networks: [sepolia, mainnet], // ✅ gösterilecek ağlar
    defaultNetwork: sepolia,
    metadata,
    features: { analytics: true },
  });
  (globalThis as any).__AUX_APPKIT_INIT__ = true;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as WagmiConfig,
    typeof document !== 'undefined' ? document.cookie : null
  );

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as WagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
  
}
