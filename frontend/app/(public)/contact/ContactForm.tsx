"use client";

import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { CATEGORY_LABEL, formatWon, inquiryApi } from "@/lib/api/inquiry";
import type {
  Category,
  EstimateInput,
  EstimateResult,
  Grade,
  PublicEstimateConfig,
  PublicEstimateOption,
} from "@/lib/api/types";

type Step = "space" | "options" | "result" | "contact" | "done";

const PYEONG_TO_M2 = 3.3058;

export default function ContactForm({ config }: { config: PublicEstimateConfig | null }) {
  const estimateEnabled = Boolean(config?.enabled && config.categories.length > 0);

  // 견적을 거치지 않고 바로 문의하는 경우 true
  const [direct, setDirect] = useState(!estimateEnabled);
  const [step, setStep] = useState<Step>(estimateEnabled ? "space" : "contact");

  const [category, setCategory] = useState<Category | null>(
    config?.categories.length === 1 ? config.categories[0].category : null
  );
  const [grade, setGrade] = useState<Grade | null>(null);
  const [area, setArea] = useState("");
  // optionId → 수량 (선택 안 한 옵션은 키 없음)
  const [selected, setSelected] = useState<Record<number, number>>({});

  const [result, setResult] = useState<EstimateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grades = useMemo(
    () => config?.categories.find((c) => c.category === category)?.grades ?? [],
    [config, category]
  );
  const options = useMemo(
    () =>
      (config?.options ?? []).filter(
        (o) => category && (o.appliesTo === "ALL" || o.appliesTo === category)
      ),
    [config, category]
  );

  const areaNumber = Number(area);
  const areaValid = area !== "" && Number.isFinite(areaNumber) && areaNumber >= 1 && areaNumber <= 1000;
  // 서버와 같이 소수 첫째 자리까지만 사용
  const areaPyeong = Math.round(areaNumber * 10) / 10;

  // 입력 중 미리 보여주는 금액 (최소 공사 금액·범위는 결과 화면에서 서버가 적용)
  const rate = grades.find((g) => g.grade === grade)?.pricePerPyeong ?? null;
  const baseAmount = rate != null && areaValid ? Math.round(areaPyeong * rate) : null;

  function optionAmount(o: PublicEstimateOption): number {
    switch (o.pricingType) {
      case "PER_PYEONG":
        return areaValid ? Math.round(areaPyeong * o.unitPrice) : 0;
      case "PER_UNIT":
        return o.unitPrice * (selected[o.id] ?? 1);
      default:
        return o.unitPrice;
    }
  }

  const optionsTotal = options
    .filter((o) => selected[o.id] != null)
    .reduce((sum, o) => sum + optionAmount(o), 0);

  function estimateInput(): EstimateInput | null {
    if (!category || !grade || !areaValid) return null;
    return {
      category,
      grade,
      areaPyeong,
      options: options
        .filter((o) => selected[o.id] != null)
        .map((o) =>
          o.pricingType === "PER_UNIT"
            ? { optionId: o.id, quantity: selected[o.id] }
            : { optionId: o.id }
        ),
    };
  }

  function chooseCategory(c: Category) {
    setCategory(c);
    setGrade(null);
    setSelected({});
    setResult(null);
  }

  function toggleOption(o: PublicEstimateOption) {
    setResult(null);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[o.id] != null) delete next[o.id];
      else next[o.id] = 1;
      return next;
    });
  }

  function changeQuantity(id: number, delta: number) {
    setResult(null);
    setSelected((prev) => ({ ...prev, [id]: Math.min(99, Math.max(1, (prev[id] ?? 1) + delta)) }));
  }

  async function calculate() {
    const input = estimateInput();
    if (!input) return;
    setError(null);
    setBusy(true);
    try {
      setResult(await inquiryApi.calculateEstimate(input));
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "견적을 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setBusy(true);
    try {
      await inquiryApi.create({
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? "") || null,
        content: String(form.get("content") ?? ""),
        privacyAgreed: form.get("privacy") === "on",
        estimate: direct ? null : estimateInput(),
        website: String(form.get("website") ?? ""),
      });
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError && err.validationErrors?.length) {
        setError(err.validationErrors.map((v) => v.message).join("\n"));
      } else {
        setError(err instanceof ApiError ? err.message : "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  function startDirect() {
    setDirect(true);
    setError(null);
    setStep("contact");
  }

  function backToEstimate() {
    setDirect(false);
    setError(null);
    setStep(result ? "result" : "space");
  }

  if (step === "done") {
    return (
      <div className="border border-border px-6 py-10 text-center">
        <p className="text-lg font-light">문의가 접수되었습니다.</p>
        <p className="mt-3 text-sm text-muted">확인 후 남겨주신 연락처로 안내드리겠습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {estimateEnabled && !direct && <StepIndicator step={step} hasOptions={options.length > 0} />}

      {step === "space" && config && (
        <section className="space-y-8">
          <div>
            <Label>공간 유형</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {config.categories.map((c) => (
                <Choice key={c.category} active={category === c.category} onClick={() => chooseCategory(c.category)}>
                  {CATEGORY_LABEL[c.category]}
                </Choice>
              ))}
            </div>
          </div>

          {category && (
            <div>
              <Label>마감 등급</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {grades.map((g) => (
                  <Choice key={g.grade} active={grade === g.grade} onClick={() => { setGrade(g.grade); setResult(null); }}>
                    <span className="block">{g.label}</span>
                    <span className={`mt-0.5 block text-xs ${grade === g.grade ? "text-background/80" : "text-muted"}`}>
                      평당 {formatWon(g.pricePerPyeong)}
                    </span>
                  </Choice>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>평수</Label>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={1000}
                step={0.1}
                value={area}
                onChange={(e) => { setArea(e.target.value); setResult(null); }}
                placeholder="예: 32"
                className="w-32 border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <span className="text-sm">평</span>
              {areaValid && (
                <span className="text-xs text-muted">≈ {(areaNumber * PYEONG_TO_M2).toFixed(1)}㎡</span>
              )}
              {baseAmount != null && rate != null && (
                <span className="text-sm md:ml-4">
                  기본 공사 <strong className="font-medium">약 {formatWon(baseAmount)}</strong>
                  <span className="ml-1 text-xs text-muted">
                    ({areaPyeong}평 × 평당 {formatWon(rate)})
                  </span>
                </span>
              )}
            </div>
            {area !== "" && !areaValid && (
              <p className="mt-2 text-xs text-red-600">1 ~ 1000평 사이로 입력해 주세요.</p>
            )}
          </div>

          <ErrorText error={error} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PrimaryButton
              disabled={!category || !grade || !areaValid || busy}
              onClick={() => (options.length > 0 ? setStep("options") : calculate())}
            >
              {options.length > 0 ? "다음" : busy ? "계산 중..." : "예상 견적 보기"}
            </PrimaryButton>
            <TextButton onClick={startDirect}>견적 없이 바로 문의하기</TextButton>
          </div>
        </section>
      )}

      {step === "options" && (
        <section className="space-y-6">
          <div>
            <Label>추가 옵션 (선택)</Label>
            <p className="mt-2 text-xs text-muted">필요한 항목을 모두 선택해 주세요. 선택하지 않아도 됩니다.</p>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {options.map((o) => {
              const checked = selected[o.id] != null;
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(o)}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm">{o.name}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {unitPriceLabel(o)}
                        {o.description && ` · ${o.description}`}
                      </span>
                    </span>
                  </label>
                  {checked && (
                    <div className="flex items-center gap-3">
                      {o.pricingType === "PER_UNIT" && (
                        <div className="flex items-center border border-border text-sm">
                          <button type="button" onClick={() => changeQuantity(o.id, -1)} className="px-3 py-1.5" aria-label="수량 줄이기">−</button>
                          <span className="min-w-10 px-2 text-center">
                            {selected[o.id]}{o.unitLabel ?? "개"}
                          </span>
                          <button type="button" onClick={() => changeQuantity(o.id, 1)} className="px-3 py-1.5" aria-label="수량 늘리기">+</button>
                        </div>
                      )}
                      <span className="min-w-20 text-right text-sm">+ {formatWon(optionAmount(o))}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {baseAmount != null && (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4 text-muted">
                <dt>기본 공사</dt>
                <dd>{formatWon(baseAmount)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>옵션</dt>
                <dd>{optionsTotal > 0 ? `+ ${formatWon(optionsTotal)}` : "-"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
                <dt>현재 합계</dt>
                <dd>약 {formatWon(baseAmount + optionsTotal)}</dd>
              </div>
            </dl>
          )}

          <ErrorText error={error} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PrimaryButton disabled={busy} onClick={calculate}>
              {busy ? "계산 중..." : "예상 견적 보기"}
            </PrimaryButton>
            <TextButton onClick={() => setStep("space")}>이전</TextButton>
          </div>
        </section>
      )}

      {step === "result" && result && (
        <section className="space-y-8">
          <EstimateSummary
            result={result}
            category={category}
            gradeLabel={grades.find((g) => g.grade === grade)?.label ?? ""}
            area={area}
            optionLines={options
              .filter((o) => selected[o.id] != null)
              .map((o) => (o.pricingType === "PER_UNIT" ? `${o.name} ${selected[o.id]}${o.unitLabel ?? "개"}` : o.name))}
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PrimaryButton onClick={() => setStep("contact")}>이 견적으로 상담 신청</PrimaryButton>
            <TextButton onClick={() => setStep("space")}>조건 바꿔서 다시 계산</TextButton>
          </div>
        </section>
      )}

      {step === "contact" && (
        <form onSubmit={onSubmit} className="space-y-5">
          {!direct && result && (
            <div className="border border-border bg-surface-alt/60 px-4 py-3 text-sm">
              <span className="text-muted">예상 견적 </span>
              <span className="font-medium">{resultText(result)}</span>
              <span className="text-muted"> 기준으로 상담을 신청합니다.</span>
            </div>
          )}
          <Field label="이름" name="name" required maxLength={100} />
          <Field label="연락처" name="phone" type="tel" required maxLength={30} />
          <Field label="이메일 (선택)" name="email" type="email" maxLength={255} />
          <div>
            <Label>{direct ? "문의 내용" : "요청 사항 (선택)"}</Label>
            <textarea
              name="content"
              required={direct}
              rows={direct ? 6 : 4}
              maxLength={5000}
              placeholder={direct ? undefined : "희망 시기, 현장 위치, 참고할 스타일 등을 남겨주세요."}
              className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          {/* 스팸 방지용 숨김 필드 */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="privacy" required className="h-4 w-4" />
            개인정보 수집 및 이용에 동의합니다.
          </label>

          <ErrorText error={error} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center border border-foreground px-8 py-3 text-sm transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {busy ? "전송 중..." : direct ? "문의 보내기" : "상담 신청하기"}
            </button>
            {estimateEnabled && (
              direct
                ? <TextButton onClick={backToEstimate}>예상 견적 먼저 보기</TextButton>
                : <TextButton onClick={() => setStep("result")}>이전</TextButton>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function unitPriceLabel(o: PublicEstimateOption) {
  switch (o.pricingType) {
    case "PER_PYEONG":
      return `평당 ${formatWon(o.unitPrice)}`;
    case "PER_UNIT":
      return `1${o.unitLabel ?? "개"}당 ${formatWon(o.unitPrice)}`;
    default:
      return formatWon(o.unitPrice);
  }
}

function resultText(r: EstimateResult) {
  return r.displayMode === "RANGE" && r.minAmount !== r.maxAmount
    ? `${formatWon(r.minAmount)} ~ ${formatWon(r.maxAmount)}`
    : `약 ${formatWon(r.amount)}`;
}

function EstimateSummary({
  result,
  category,
  gradeLabel,
  area,
  optionLines,
}: {
  result: EstimateResult;
  category: Category | null;
  gradeLabel: string;
  area: string;
  optionLines: string[];
}) {
  return (
    <div className="border border-border bg-surface-alt/60 px-6 py-8">
      <p className="text-xs tracking-[0.2em] text-muted">예상 견적</p>
      <p className="mt-3 text-2xl font-light leading-snug md:text-3xl">{resultText(result)}</p>
      <dl className="mt-6 space-y-1 text-sm">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-muted">공간</dt>
          <dd>{category ? CATEGORY_LABEL[category] : ""} · {gradeLabel} · {area}평</dd>
        </div>
        {optionLines.length > 0 && (
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted">옵션</dt>
            <dd>{optionLines.join(", ")}</dd>
          </div>
        )}
      </dl>
      {result.notice && <p className="mt-6 text-xs text-muted whitespace-pre-line">{result.notice}</p>}
    </div>
  );
}

function StepIndicator({ step, hasOptions }: { step: Step; hasOptions: boolean }) {
  const steps: { key: Step; label: string }[] = [
    { key: "space", label: "공간 정보" },
    ...(hasOptions ? [{ key: "options" as Step, label: "옵션" }] : []),
    { key: "result", label: "예상 견적" },
    { key: "contact", label: "상담 신청" },
  ];
  const current = steps.findIndex((s) => s.key === step);
  return (
    <ol className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-[0.1em]">
      {steps.map((s, i) => (
        <li key={s.key} className={`flex items-center gap-3 ${i <= current ? "text-foreground" : "text-muted/60"}`}>
          <span className={i === current ? "border-b border-foreground pb-0.5" : ""}>
            {String(i + 1).padStart(2, "0")} {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-muted/60">—</span>}
        </li>
      ))}
    </ol>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs tracking-[0.2em] text-muted">{children}</p>;
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-5 py-2.5 text-sm transition-colors ${
        active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center border border-foreground px-8 py-3 text-sm transition-colors hover:bg-foreground hover:text-background disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
    >
      {children}
    </button>
  );
}

function TextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
      {children}
    </button>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="whitespace-pre-line text-sm text-red-600">{error}</p>;
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={maxLength}
        className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
      />
    </div>
  );
}
