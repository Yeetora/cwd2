"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { FONT_OPTIONS, findFont, fontStack, type FontKind } from "@/lib/fonts";

const KIND_LABEL: Record<FontKind, string> = { sans: "고딕 (깔끔한)", serif: "명조 (우아한)" };

/** 제목/본문 폰트 선택 + 바로 보이는 샘플 + 실제 사이트 미리보기(저장 안 함) */
export default function FontSettings({
  initialHeading,
  initialBody,
  brand,
}: {
  initialHeading: string | null;
  initialBody: string | null;
  brand: string;
}) {
  const router = useRouter();
  const [heading, setHeading] = useState(initialHeading ?? "");
  const [body, setBody] = useState(initialBody ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headingFont = findFont(heading);
  const bodyFont = findFont(body);
  const dirty = heading !== (initialHeading ?? "") || body !== (initialBody ?? "");

  // 샘플에 쓰려고 고른 폰트 파일을 관리자 화면에도 불러온다
  useEffect(() => {
    for (const f of [headingFont, bodyFont]) {
      if (f && !document.querySelector(`link[href="${f.css}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = f.css;
        document.head.appendChild(link);
      }
    }
  }, [headingFont, bodyFont]);

  function previewOnSite() {
    const sp = new URLSearchParams({ fontHeading: heading, fontBody: body });
    window.open(`/?${sp.toString()}`, "_blank", "noopener");
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      await adminApi.updateFonts(heading || null, body || null);
      setMsg("폰트가 저장되었습니다. 사이트에 바로 적용됩니다.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white border border-neutral-200 p-6">
      <h2 className="text-sm font-medium tracking-[0.2em] text-neutral-500 uppercase">폰트</h2>
      <p className="mt-1 text-xs text-neutral-500">
        공개 사이트의 제목과 본문 글꼴을 고릅니다. 아래 샘플로 바로 확인하고, &quot;사이트에서 미리보기&quot;로 실제 화면을 저장 없이 볼 수 있어요.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FontSelect label="제목 폰트" value={heading} onChange={setHeading} hint="큰 제목·섹션 제목" />
        <FontSelect label="본문 폰트" value={body} onChange={setBody} hint="메뉴·설명·본문 글" />
      </div>

      {/* 샘플 */}
      <div className="mt-6 border border-neutral-200 bg-[#f7f4ee] p-6" style={{ fontFamily: fontStack(bodyFont) }}>
        <div className="flex gap-6 text-sm text-neutral-700">
          <span>Home</span>
          <span>About</span>
          <span className="font-semibold">Project</span>
          <span>Contact</span>
        </div>
        <p className="mt-8 text-[11px] tracking-[0.25em] text-[#a3845c]">{brand} · RESIDENTIAL</p>
        <p className="mt-2 text-3xl font-light leading-tight text-neutral-900" style={{ fontFamily: fontStack(headingFont ?? bodyFont) }}>
          공간에 담기는
          <br />
          절제된 감성
        </p>
        <p className="mt-2 text-xl font-light tracking-tight text-neutral-900" style={{ fontFamily: fontStack(headingFont ?? bodyFont) }}>
          SPACES WE CREATED
        </p>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-600">
          화려하지 않지만 세련된 공간, 디테일한 감성을 살린 디자인. 주거와 상업 공간 모두에 어울리는 인테리어를 제안합니다. 0123456789
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={previewOnSite}
          className="border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          사이트에서 미리보기 ↗
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="border border-foreground bg-foreground px-5 py-2 text-sm text-background hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "저장 중..." : "폰트 저장"}
        </button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </section>
  );
}

function FontSelect({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs tracking-[0.1em] text-neutral-500">
        {label} <span className="text-neutral-400">· {hint}</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
      >
        <option value="">기본 (현재 폰트)</option>
        {(Object.keys(KIND_LABEL) as FontKind[]).map((kind) => (
          <optgroup key={kind} label={KIND_LABEL[kind]}>
            {FONT_OPTIONS.filter((f) => f.kind === kind).map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
