'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-neutral-50', 'text-neutral-900');
      document.body.classList.add('bg-neutral-900', 'text-neutral-50');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-neutral-900', 'text-neutral-50');
      document.body.classList.add('bg-neutral-50', 'text-neutral-900');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 shadow-sm hover:shadow transition text-sm"
      aria-label="Toggle theme"
      title="Theme"
    >
      Theme {dark ? '🌙' : '🌞'}
    </button>
  );
}
