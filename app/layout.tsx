import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  DM_Sans,
  JetBrains_Mono,
  Grand_Hotel,
} from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const grandHotel = Grand_Hotel({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lurk — Anonymous Q&A & Confession Games',
  description:
    'Send anonymous confessions, Truth or Dare challenges, voice notes, and Guess Who quizzes.',
  openGraph: {
    title: 'Lurk — Send me an anonymous message',
    description:
      'Drop an anonymous whisper, clue, or voice note—100% private.',
    siteName: 'Lurk',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lurk — Send me an anonymous message',
    description:
      'Drop an anonymous whisper, clue, or voice note—100% private.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${grandHotel.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#FFF7F5] text-[#191116] dark:bg-[#0B080D] dark:text-[#F9F5F7] transition-colors duration-200 selection:bg-[#FF2E63]/20 selection:text-[#FF2E63]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
