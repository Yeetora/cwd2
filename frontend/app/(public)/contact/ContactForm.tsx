"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: 백엔드 연결 후 fetch("/api/inquiries", ...)
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setDone(true);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="이름" name="name" required />
      <Field label="연락처" name="phone" type="tel" required />
      <Field label="이메일 (선택)" name="email" type="email" />
      <div>
        <label className="text-xs tracking-[0.2em] text-muted">문의 내용</label>
        <textarea
          name="content"
          required
          rows={6}
          className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" required className="h-4 w-4" />
        개인정보 수집 및 이용에 동의합니다.
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center border border-foreground px-8 py-3 text-sm transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
      >
        {submitting ? "전송 중..." : "문의 보내기"}
      </button>
      {done && (
        <p className="text-sm text-foreground/80">
          문의가 접수되었습니다. (현재는 데모 — 백엔드 연결 시 실제 발송됩니다)
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs tracking-[0.2em] text-muted">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
      />
    </div>
  );
}
