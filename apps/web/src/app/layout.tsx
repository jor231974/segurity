import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { PwaRegistration } from '@/components/pwa-registration';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmProvider } from '@/components/ui/confirm';

export const metadata: Metadata = {
  title: 'Servicom Seguridad',
  description: 'Sistema integral para empresas de seguridad privada',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3558c9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
              <PwaRegistration />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}