"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { CATEGORY_LABEL, GRADE_LABEL, formatWon } from "@/lib/api/inquiry";
import type {
  AdminEstimateConfig,
  AppliesTo,
  BaseRate,
  Category,
  DisplayMode,
  EstimateOption,
  EstimateOptionInput,
  Grade,
  PricingType,
} from "@/lib/api/types";

const CATEGORIES: Category[] = ["RESIDENTIAL", "COMMERCIAL"];
const GRADES: Grade[] = ["BASIC", "STANDARD", "PREMIUM"];

const PRICING_LABEL: Record<PricingType, string> = {
  PER_PYEONG: "평당",
  PER_UNIT: "개당(수량)",
  FIXED: "고정 금액",
};
const APPLIES_LABEL: Record<AppliesTo, string> = {
  ALL: "전체",
  RESIDENTIAL: "주거만",
  COMMERCIAL: "상업만",
};

const inputCls = "w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
const sectionCls = "border border-neutral-200 bg-white p-5 md:p-6";

export default function EstimateSettingsForm({ initial }: { initial: AdminEstimateConfig }) {
  const [options, setOptions] = useState<EstimateOption[]>(initial.options);
  const hasAnyRate = initial.rates.some((r) => (r.pricePerPyeong ?? 0) > 0);
  const [ratesSet, setRatesSet] = useState(hasAnyRate);

  return (
    <div className="space-y-8">
      <SettingsSection initial={initial.settings} hasAnyRate={ratesSet} />
      <RatesSection initial={initial.rates} onSaved={(rates) => setRatesSet(rates.some((r) => (r.pricePerPyeong ?? 0) > 0))} />
      <OptionsSection options={options} setOptions={setOptions} />
    </div>
  );
}

// ── 기본 설정 ──────────────────────────────────────

function SettingsSection({
  initial,
  hasAnyRate,
}: {
  initial: AdminEstimateConfig["settings"];
  hasAnyRate: boolean;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initial.displayMode);
  const [rangePercent, setRangePercent] = useState(String(initial.rangePercent));
  const [minimumAmount, setMinimumAmount] = useState(initial.minimumAmount != null ? String(initial.minimumAmount) : "");
  const [notice, setNotice] = useState(initial.notice ?? "");
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ busy: true });
    try {
      await adminApi.updateEstimateSettings({
        enabled,
        displayMode,
        rangePercent: Number(rangePercent) || 0,
        minimumAmount: minimumAmount.trim() === "" ? null : Number(minimumAmount),
        notice: notice.trim() || null,
      });
      setStatus({ msg: "기본 설정이 저장되었습니다." });
    } catch (err) {
      setStatus({ error: errorMessage(err) });
    }
  }

  return (
    <form onSubmit={onSubmit} className={sectionCls}>
      <SectionTitle title="기본 설정" desc="견적 기능 사용 여부와 고객에게 보여줄 결과 형식을 정합니다." />

      <div className="mt-6 space-y-6">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4" />
          문의하기 화면에 예상 견적 기능 사용
        </label>
        {enabled && !hasAnyRate && (
          <p className="text-xs text-amber-700">
            평당 단가가 하나도 입력되지 않아 고객 화면에는 아직 표시되지 않습니다. 아래에서 단가를 입력해 주세요.
          </p>
        )}

        <div>
          <FieldLabel>결과 표시 방식</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="displayMode" checked={displayMode === "RANGE"} onChange={() => setDisplayMode("RANGE")} />
              금액 범위 (예: 4,380만 ~ 5,360만 원)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="displayMode" checked={displayMode === "SINGLE"} onChange={() => setDisplayMode("SINGLE")} />
              단일 금액 (예: 약 4,870만 원)
            </label>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <FieldLabel>범위 폭 (±%)</FieldLabel>
            <input
              type="number"
              min={0}
              max={50}
              value={rangePercent}
              disabled={displayMode !== "RANGE"}
              onChange={(e) => setRangePercent(e.target.value)}
              className={`${inputCls} mt-2 disabled:bg-neutral-100`}
            />
            <p className="mt-1 text-xs text-neutral-500">계산 금액의 위아래로 이만큼 넓혀서 보여줍니다. (0~50)</p>
          </div>
          <div>
            <FieldLabel>최소 공사 금액 (원, 선택)</FieldLabel>
            <MoneyInput value={minimumAmount} onChange={setMinimumAmount} placeholder="예: 10000000" />
            <p className="mt-1 text-xs text-neutral-500">계산 결과가 이보다 작으면 이 금액으로 안내합니다.</p>
          </div>
        </div>

        <div>
          <FieldLabel>고객 안내 문구</FieldLabel>
          <textarea
            rows={3}
            maxLength={1000}
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="예: 현장 실측과 자재 선택에 따라 실제 견적은 달라질 수 있습니다."
            className={`${inputCls} mt-2`}
          />
        </div>
      </div>

      <SaveRow status={status} label="기본 설정 저장" />
    </form>
  );
}

// ── 평당 단가 ──────────────────────────────────────

function RatesSection({ initial, onSaved }: { initial: BaseRate[]; onSaved: (rates: BaseRate[]) => void }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((r) => [key(r.category, r.grade), r.pricePerPyeong != null ? String(r.pricePerPyeong) : ""]))
  );
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ busy: true });
    try {
      const rates: BaseRate[] = CATEGORIES.flatMap((category) =>
        GRADES.map((grade) => {
          const v = values[key(category, grade)]?.trim() ?? "";
          return { category, grade, pricePerPyeong: v === "" ? null : Number(v) };
        })
      );
      const updated = await adminApi.updateEstimateRates(rates);
      onSaved(updated.rates);
      setStatus({ msg: "평당 단가가 저장되었습니다." });
    } catch (err) {
      setStatus({ error: errorMessage(err) });
    }
  }

  return (
    <form onSubmit={onSubmit} className={sectionCls}>
      <SectionTitle
        title="평당 단가"
        desc="기본 공사비 = 평수 × 평당 단가. 비워 두면 해당 등급은 고객 화면에 나타나지 않습니다."
      />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="px-3 py-2 w-28">공간</th>
              {GRADES.map((g) => (
                <th key={g} className="px-3 py-2">{GRADE_LABEL[g]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => (
              <tr key={c} className="border-b border-neutral-200 align-top">
                <td className="px-3 py-3">{CATEGORY_LABEL[c]}</td>
                {GRADES.map((g) => (
                  <td key={g} className="px-3 py-3">
                    <MoneyInput
                      value={values[key(c, g)] ?? ""}
                      onChange={(v) => setValues((prev) => ({ ...prev, [key(c, g)]: v }))}
                      placeholder="미제공"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SaveRow status={status} label="평당 단가 저장" />
    </form>
  );
}

// ── 옵션 ──────────────────────────────────────────

const EMPTY_OPTION: EstimateOptionInput = {
  name: "",
  description: null,
  appliesTo: "ALL",
  pricingType: "PER_UNIT",
  unitPrice: 0,
  unitLabel: "개",
  active: true,
  displayOrder: null,
};

function OptionsSection({
  options,
  setOptions,
}: {
  options: EstimateOption[];
  setOptions: React.Dispatch<React.SetStateAction<EstimateOption[]>>;
}) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function sortOptions(list: EstimateOption[]) {
    return [...list].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  }

  async function onDelete(o: EstimateOption) {
    if (!confirm(`'${o.name}' 옵션을 삭제하시겠습니까?`)) return;
    setError(null);
    try {
      await adminApi.deleteEstimateOption(o.id);
      setOptions((prev) => prev.filter((p) => p.id !== o.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className={sectionCls}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title="옵션 항목"
          desc="실링팬, 욕실, 붙박이장처럼 고객이 골라서 더할 수 있는 항목입니다. 추가하면 바로 고객 견적 화면에 나타납니다."
        />
        {editingId !== "new" && (
          <button
            type="button"
            onClick={() => setEditingId("new")}
            className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white hover:opacity-90"
          >
            + 옵션 추가
          </button>
        )}
      </div>

      {editingId === "new" && (
        <div className="mt-6">
          <OptionEditor
            initial={EMPTY_OPTION}
            onCancel={() => setEditingId(null)}
            onSave={async (input) => {
              const created = await adminApi.createEstimateOption(input);
              setOptions((prev) => sortOptions([...prev, created]));
              setEditingId(null);
            }}
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {options.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">등록된 옵션이 없습니다.</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {options.map((o) =>
            editingId === o.id ? (
              <li key={o.id} className="py-4">
                <OptionEditor
                  initial={o}
                  onCancel={() => setEditingId(null)}
                  onSave={async (input) => {
                    const updated = await adminApi.updateEstimateOption(o.id, input);
                    setOptions((prev) => sortOptions(prev.map((p) => (p.id === o.id ? updated : p))));
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{o.name}</span>
                    {!o.active && <span className="bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">숨김</span>}
                    <span className="text-xs text-neutral-500">{APPLIES_LABEL[o.appliesTo]}</span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {PRICING_LABEL[o.pricingType]} {o.unitPrice.toLocaleString("ko-KR")}원
                    {o.pricingType === "PER_UNIT" && ` / ${o.unitLabel ?? "개"}`}
                    {o.description && ` · ${o.description}`}
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button type="button" onClick={() => setEditingId(o.id)} className="text-neutral-700 hover:underline">수정</button>
                  <button type="button" onClick={() => onDelete(o)} className="text-red-600 hover:underline">삭제</button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}

function OptionEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: EstimateOptionInput;
  onSave: (input: EstimateOptionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [appliesTo, setAppliesTo] = useState<AppliesTo>(initial.appliesTo);
  const [pricingType, setPricingType] = useState<PricingType>(initial.pricingType);
  const [unitPrice, setUnitPrice] = useState(initial.unitPrice ? String(initial.unitPrice) : "");
  const [unitLabel, setUnitLabel] = useState(initial.unitLabel ?? "");
  const [active, setActive] = useState(initial.active);
  const [displayOrder, setDisplayOrder] = useState(initial.displayOrder != null ? String(initial.displayOrder) : "");
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ busy: true });
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        appliesTo,
        pricingType,
        unitPrice: Number(unitPrice) || 0,
        unitLabel: pricingType === "PER_UNIT" ? unitLabel.trim() || "개" : null,
        active,
        displayOrder: displayOrder.trim() === "" ? null : Number(displayOrder),
      });
    } catch (err) {
      setStatus({ error: errorMessage(err) });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-neutral-50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>이름 *</FieldLabel>
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 실링팬 설치" className={`${inputCls} mt-2`} />
        </div>
        <div>
          <FieldLabel>설명 (선택)</FieldLabel>
          <input maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="고객에게 보이는 짧은 설명" className={`${inputCls} mt-2`} />
        </div>
        <div>
          <FieldLabel>적용 공간</FieldLabel>
          <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as AppliesTo)} className={`${inputCls} mt-2`}>
            {(Object.keys(APPLIES_LABEL) as AppliesTo[]).map((a) => (
              <option key={a} value={a}>{APPLIES_LABEL[a]}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>계산 방식</FieldLabel>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as PricingType)} className={`${inputCls} mt-2`}>
            {(Object.keys(PRICING_LABEL) as PricingType[]).map((p) => (
              <option key={p} value={p}>{PRICING_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>
            {pricingType === "PER_PYEONG" ? "평당 금액 (원) *" : pricingType === "PER_UNIT" ? "1개당 금액 (원) *" : "금액 (원) *"}
          </FieldLabel>
          <MoneyInput value={unitPrice} onChange={setUnitPrice} required />
        </div>
        {pricingType === "PER_UNIT" ? (
          <div>
            <FieldLabel>단위</FieldLabel>
            <input maxLength={20} value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="개, 대, 실 …" className={`${inputCls} mt-2`} />
          </div>
        ) : (
          <div />
        )}
        <div>
          <FieldLabel>표시 순서 (작을수록 위)</FieldLabel>
          <input type="number" min={0} max={9999} value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="비우면 맨 뒤" className={`${inputCls} mt-2`} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
          고객 화면에 표시
        </label>
      </div>

      {status?.error && <p className="text-sm text-red-600">{status.error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={status?.busy} className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50">
          {status?.busy ? "저장 중..." : "저장"}
        </button>
        <button type="button" onClick={onCancel} className="border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
          취소
        </button>
      </div>
    </form>
  );
}

// ── 공통 ──────────────────────────────────────────

type Status = { busy?: boolean; msg?: string; error?: string } | null;

function key(c: Category, g: Grade) {
  return `${c}:${g}`;
}

function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.validationErrors?.length) return err.validationErrors.map((v) => `${v.field}: ${v.message}`).join("\n");
    return err.message;
  }
  return "저장 실패";
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-light">{title}</h2>
      <p className="mt-1 text-xs text-neutral-500">{desc}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs tracking-[0.1em] text-neutral-500">{children}</label>;
}

function MoneyInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const n = Number(value);
  return (
    <div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} mt-2`}
      />
      <p className="mt-1 h-4 text-xs text-neutral-500">
        {value !== "" && Number.isFinite(n) && n > 0
          ? `${n.toLocaleString("ko-KR")}원${n >= 10_000 ? ` (${formatWon(n)})` : ""}`
          : ""}
      </p>
    </div>
  );
}

function SaveRow({ status, label }: { status: Status; label: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <button
        type="submit"
        disabled={status?.busy}
        className="border border-neutral-900 bg-neutral-900 px-5 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {status?.busy ? "저장 중..." : label}
      </button>
      {status?.msg && <span className="text-sm text-emerald-700">{status.msg}</span>}
      {status?.error && <span className="whitespace-pre-line text-sm text-red-600">{status.error}</span>}
    </div>
  );
}
