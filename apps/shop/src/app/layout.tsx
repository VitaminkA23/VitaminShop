import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Vitamin Shop',
    description: 'Premium vitamins and supplements',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        {children}
        </body>
        </html>
    );
}