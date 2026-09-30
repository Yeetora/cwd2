import { cookies } from "next/headers";
import type { Metadata } from "next";
import { serverApiBase } from "@/lib/api/client";
import type { AdminEstimateConfig } from "@/lib/api/types";
import EstimateSettingsForm from "./EstimateSettingsForm";

export const metadata: Metadata = {
  title: "견적 설정",
  robots: { index: false, follow: false },
};

async function fetchConfig(cookieHeader: string): Promise<AdminEstimateConfig | null> {
  try {
    const res = await fetch(`${serverApiBase()}/api/admin/estimate`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminEstimateConfig;
  } catch {
    return null;
  }
}

export default async function AdminEstimatePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const config = await fetchConfig(cookieHeader);

  return (
    <div>
      <h1 className="text-2xl font-light">견적 설정</h1>
      <p className="mt-2 text-sm text-neutral-500">
        문의하기 화면의 예상 견적 계산에 쓰이는 단가와 옵션을 관리합니다. 단가는 고객에게 직접 노출되지 않습니다.
      </p>

      {config ? (
        <div className="mt-8">
          <EstimateSettingsForm initial={config} />
        </div>
      ) : (
        <p className="mt-12 text-sm text-red-600">설정을 불러오지 못했습니다.</p>
      )}
    </div>
  );
}
