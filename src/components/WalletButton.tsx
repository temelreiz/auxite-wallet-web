'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletButton() {
  return (
    <div className="flex">
      <ConnectButton chainStatus="icon" showBalance={true} accountStatus="address" />
    </div>
  );
}
