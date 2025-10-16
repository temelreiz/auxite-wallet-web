// src/app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Auxite Wallet (Web)',
  description: 'Metals-backed tokens with live charts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-neutral-50 text-neutral-900">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
