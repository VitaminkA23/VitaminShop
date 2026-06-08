import type { Metadata } from 'next';
import { CartProvider } from '@/contexts/CartContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vitamin Shop',
  description: 'Premium vitamins and supplements, delivered to your door.',
};

// Root layout — minimal HTML shell only.
// All providers, Header, and locale-specific setup live in [locale]/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            {/* Весь текущий код лейаута, который там уже написан */}
            <div className="flex flex-col min-h-screen">
                {children}
            </div>
        </CartProvider>
    );
}