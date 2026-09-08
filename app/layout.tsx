import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
