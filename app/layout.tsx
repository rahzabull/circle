import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://meet-ducky-about-us.rahzabull.chatgpt.site'),
  title: 'Kin — These are your people',
  description: 'A private, playful space for the people you are actually close to.',
  openGraph: {
    title: 'Kin — These are your people',
    description: 'A private, playful space for the people you are actually close to.',
    images: [{ url: '/og.png', width: 1729, height: 910, alt: 'Meet Ducky — Our CEO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kin — These are your people',
    description: 'A private, playful space for the people you are actually close to.',
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
        className={`${manrope.variable} ${newsreader.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
