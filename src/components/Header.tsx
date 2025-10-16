import ThemeToggle from './ThemeToggle';
import WalletButton from './WalletButton';

export default function Header() {
  return (
    <header className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-cyan-100 grid place-items-center">💎</div>
          <div className="font-semibold">Auxite <span className="text-neutral-500">Wallet (Web)</span></div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          <a href="#" className="hover:text-black">Home</a>
          <a href="#" className="hover:text-black">Tokens</a>
          <a href="#" className="hover:text-black">Docs</a>
          <a href="#" className="hover:text-black">Support</a>
        </nav>

        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-neutral-300 bg-white px-3 py-2 shadow-sm text-sm">Allocation Check</button>
          <ThemeToggle />
          <div className="hidden sm:block"><WalletButton /></div>
          <div className="sm:hidden">
            <a
              href="#"
              className="rounded-xl bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-500"
            >
              Connect
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
