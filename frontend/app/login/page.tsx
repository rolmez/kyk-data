"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kyk2026demo") {
      document.cookie = `kyk_demo_auth=${password}; path=/; max-age=86400`;
      router.push("/");
    } else {
      setError("Geçersiz şifre");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md p-10 space-y-8 bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        {/* Logo & Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-2">
            <span className="text-2xl font-black text-white tracking-tight">K</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            KYK <span className="text-blue-400">DATA</span>
          </h1>
          <p className="text-sm text-blue-200/60 font-medium">
            Yapay Zeka Destekli Satış Analiz Platformu
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-blue-200/80">
              Demo Erişim Şifresi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="••••••••••"
            />
          </div>
          
          {error && (
            <p className="text-sm text-rose-400 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          
          <button
            type="submit"
            className="w-full px-4 py-3 text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all shadow-lg shadow-blue-500/25"
          >
            Giriş Yap
          </button>
        </form>

        <p className="text-center text-xs text-white/30">
          © 2026 KYK Yapı Kimyasalları · v1.0 Demo
        </p>
      </div>
    </div>
  );
}
