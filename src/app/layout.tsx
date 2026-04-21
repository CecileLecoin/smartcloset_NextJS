import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'FitLab — Essayage virtuel IA',
  description: 'Essaye ta garde-robe sur toi. Découvre de nouveaux looks.',
  manifest: '/manifest.json',
};

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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
