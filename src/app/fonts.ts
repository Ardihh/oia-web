import { Newsreader, Instrument_Sans } from 'next/font/google';

export const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  style: ['normal'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument-sans',
  display: 'swap',
});
