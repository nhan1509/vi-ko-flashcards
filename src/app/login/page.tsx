"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Sai mật khẩu");
      return;
    }
    router.replace(search.get("next") || "/");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="animate-rise space-y-4 rounded-2xl border border-line bg-card p-6 shadow-sm"
    >
      <div>
        <p className="ko text-accent">단어장</p>
        <h1 className="text-2xl font-semibold">Đăng nhập</h1>
        <p className="mt-1 text-sm text-muted">Nhập mật khẩu app để tiếp tục.</p>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span>Mật khẩu</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 outline-none ring-accent focus:ring-2"
          autoFocus
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Đang vào..." : "Vào học"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Suspense fallback={<p className="text-center text-muted">Đang tải...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
