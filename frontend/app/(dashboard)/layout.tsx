"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Genel Özet", href: "/", icon: "📊" },
    { name: "Ürün Analizi", href: "/urunler", icon: "📦" },
    { name: "Bölgeler ve Harita", href: "/bolgeler", icon: "🗺️" },
    { name: "AI Satış Danışmanı", href: "/ai-asistan", icon: "🤖" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm z-10 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            KYK DATA
          </h2>
          <p className="text-xs font-semibold text-slate-400 tracking-wider">AI ANALYTICS</p>
        </div>
        <nav className="p-4 space-y-2 mt-4 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Powered by AI · v1.0 Demo
          </p>
          <p className="text-xs text-slate-300 dark:text-slate-600 text-center mt-1">
            © 2026 KYK Yapı Kimyasalları
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-[#0b1120] relative max-h-screen">
        {children}
      </main>
    </div>
  );
}
