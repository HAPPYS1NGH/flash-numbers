'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">⚡ Flash Numbers</h1>
            <span className="bg-blue-500 text-xs text-white px-2 py-1 rounded-full">Base Sepolia</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-blue-200 text-sm">
              Test your reflexes against Base&apos;s Flashbots!
            </p>
          </div>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
} 