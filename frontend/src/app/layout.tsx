import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
import "./globals.css";
import AppShell from "../components/layout/AppShell";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Gestión de préstamos e inventario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${poppins.variable} h-full`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
