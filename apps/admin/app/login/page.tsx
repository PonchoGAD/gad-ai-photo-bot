"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [tid, setTid] = useState("");
  const router = useRouter();

  async function submit() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: tid })
    });

    if (res.ok) {
      router.push("/");
    } else {
      alert("Unauthorized");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-80">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <input
          className="w-full p-2 bg-black border border-white/20"
          placeholder="Telegram ID"
          value={tid}
          onChange={(e) => setTid(e.target.value)}
        />
        <button
          onClick={submit}
          className="w-full bg-white text-black py-2 font-semibold"
        >
          Login
        </button>
      </div>
    </div>
  );
}
