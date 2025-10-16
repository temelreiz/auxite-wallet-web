'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useState } from 'react';

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'Auxite Wallet',
    projectId: 'WALLET_CONNECT_PROJECT_ID', // TODO: WC proj id (walletconnect.com)
    chains: [mainnet],
    transports: {
      [mainnet.id]: http()
    }
  })
);

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
