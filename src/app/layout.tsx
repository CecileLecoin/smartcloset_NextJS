import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import '@/styles/globals.css';
import Refresh from '@/lib/Refresh';

export const metadata: Metadata = {
  title: 'FitLab — Essayage virtuel IA',
  description: 'Essaye ta garde-robe sur toi. Découvre de nouveaux looks.',
  manifest: '/manifest.json',
};
export const dynamic = 'force-dynamic';
// Source - https://stackoverflow.com/a/78663452
// Posted by Omar
// Retrieved 2026-04-27, License - CC BY-SA 4.0

export const dynamicParams = true
export const revalidate = false

export const fetchCache = 'force-no-store';


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B8A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-bg min-h-screen">
        <Refresh />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
