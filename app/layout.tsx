// import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Header from './components/Header';
import { Inter } from 'next/font/google';
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flash Numbers - Base Sepolia Game',
  description: 'Test your reflexes against Base\'s Flashbots! A fun game to compare regular and flashbot transaction speeds.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="py-4 text-center text-sm text-gray-500">
              <p>Built with ⚡ on Base Sepolia</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
