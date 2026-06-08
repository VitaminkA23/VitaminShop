import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vitamin Shop',
  description: 'Premium vitamins and supplements, delivered to your door.',
};

// Root layout — minimal HTML shell only.
// All providers, Header, and locale-specific setup live in [locale]/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}