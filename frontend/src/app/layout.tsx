import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import ClientOnly from '../components/ClientOnly';
import DevServiceWorkerGuard from '../components/DevServiceWorkerGuard';

export const metadata: Metadata = {
  title: 'LupaProp - Centro de Diseño Profesional',
  description: 'Una plataforma profesional para diseño y generación de propuestas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased">
        <DevServiceWorkerGuard />
        <ClientOnly>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
