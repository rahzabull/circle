import type { Metadata } from 'next';
import { Gochi_Hand, Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const gochiHand = Gochi_Hand({
  variable: '--font-gochi-hand',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://meet-ducky-about-us.rahzabull.chatgpt.site'),
  title: 'Meet Ducky — Our CEO',
  description: 'The slightly ridiculous story of how Ducky built a private home for your digital life.',
  openGraph: {
    title: 'Meet Ducky — Our CEO',
    description: 'A private place for your digital life.',
    images: [{ url: '/og.png', width: 1729, height: 910, alt: 'Meet Ducky — Our CEO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet Ducky — Our CEO',
    description: 'A private place for your digital life.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${gochiHand.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
