import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Auxite Wallet',
  description: 'Auxite wallet dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <Providers>
          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
