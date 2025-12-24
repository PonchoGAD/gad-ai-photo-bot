// apps/admin/app/login/page.tsx
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [telegramId, setTelegramId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function login() {
    setMsg(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ telegramId })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error ?? "Login failed");
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <p className="text-white/70 text-sm">
        Введи свой Telegram ID (должен быть в ADMIN_TELEGRAM_IDS).
      </p>

      <input
        className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
        placeholder="Telegram ID"
      />

      <button
        className="rounded bg-white text-black px-4 py-2 font-semibold"
        onClick={login}
      >
        Login
      </button>

      {msg && <div className="text-red-400 text-sm">{msg}</div>}
    </div>
  );
}
