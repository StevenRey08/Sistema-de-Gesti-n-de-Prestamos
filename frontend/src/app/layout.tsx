import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Gestión de préstamos e inventario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full flex bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
