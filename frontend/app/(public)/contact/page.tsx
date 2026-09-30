import type { Metadata } from "next";
import { publicApi } from "@/lib/api/public";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const [siteInfo, estimateConfig] = await Promise.all([
    publicApi.getSiteInfo(),
    publicApi.getEstimateConfig(),
  ]);

  const contacts = [
    { label: "PHONE", value: siteInfo?.companyPhone },
    { label: "EMAIL", value: siteInfo?.companyEmail },
    { label: "ADDRESS", value: siteInfo?.companyAddress },
    { label: "HOURS", value: siteInfo?.businessHours },
  ].filter((c): c is { label: string; value: string } => Boolean(c.value));

  const estimateEnabled = estimateConfig?.enabled ?? false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
      <p className="text-xs tracking-[0.3em] text-muted">CONTACT</p>
      <h1 className="mt-4 text-3xl font-light md:text-4xl">문의하기</h1>
      <p className="mt-4 max-w-2xl text-muted">
        {estimateEnabled
          ? "공간 정보를 입력하시면 예상 견적을 먼저 확인하실 수 있습니다. 확인 후 상담을 신청해 주세요."
          : "프로젝트에 대한 모든 문의는 아래 양식 또는 연락처로 부탁드립니다."}
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_280px]">
        <ContactForm config={estimateEnabled ? estimateConfig : null} />

        {contacts.length > 0 && (
          <aside className="space-y-6 text-sm">
            {contacts.map((c) => (
              <div key={c.label}>
                <div className="text-xs tracking-[0.2em] text-muted">{c.label}</div>
                <div className="mt-2 whitespace-pre-line">{c.value}</div>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
