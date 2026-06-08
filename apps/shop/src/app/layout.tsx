import type { Metadata } from 'next';
import { CartProvider } from '@/contexts/CartContext';
import '../globals.css';

export const metadata: Metadata = {
    title: 'Vitamin Shop',
    description: 'Premium vitamins and supplements, delivered to your door.',
};

export default function LocaleLayout({
                                         children,
                                         params,
                                     }: {
    children: React.ReactNode;
    params: Promise<{ locale: string }> | { locale: string };
}) {
    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
                {children}
            </div>
        </CartProvider>
    );
}