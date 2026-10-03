import { Metadata } from 'next';
import React from 'react';
import './styles/globals.css';
import ClientLayout from './client-layout';

export const metadata: Metadata = {
  title: 'BeakDash - AI-Powered Dashboard Creator',
  description: 'Create customized, data-driven dashboards with AI assistance',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}