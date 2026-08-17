"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.login(username, password);
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "로그인 중 오류가 발생했습니다";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white border border-neutral-200 p-8">
      <div>
        <label className="text-xs tracking-[0.2em] text-neutral-500">아이디</label>
        <input
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="text-xs tracking-[0.2em] text-neutral-500">비밀번호</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full border border-foreground bg-foreground text-background py-2 text-sm hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
