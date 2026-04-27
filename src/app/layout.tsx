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
