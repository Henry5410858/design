import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { UserProvider } from '../context/UserContext';
import ClientOnly from '../components/ClientOnly';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} font-sans antialiased`}>
        <ClientOnly>
          <UserProvider>
            {children}
          </UserProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
