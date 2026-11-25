import { cookies } from "next/headers";
import type { Metadata } from "next";
import { serverApiBase } from "@/lib/api/client";
import type { SiteInfo } from "@/lib/api/types";
import SiteInfoForm from "./SiteInfoForm";
import FontSettings from "./FontSettings";
import { BRAND_EYEBROW } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "사이트 설정",
  robots: { index: false, follow: false },
};

async function fetchSiteInfo(cookieHeader: string): Promise<SiteInfo | null> {
  try {
    const res = await fetch(`${serverApiBase()}/api/admin/site-info`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SiteInfo;
  } catch {
    return null;
  }
}

export default async function AdminSiteInfoPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const siteInfo = await fetchSiteInfo(cookieHeader);

  return (
    <div>
      <h1 className="text-2xl font-light">사이트 설정</h1>
      <p className="mt-2 text-sm text-neutral-500">
        로고, 연락처, 메인 배너 이미지, 폰트를 관리합니다.
      </p>

      <div className="mt-8">
        <SiteInfoForm initial={siteInfo} />
        <div className="mt-10 max-w-2xl">
          <FontSettings
            initialHeading={siteInfo?.fontHeading ?? null}
            initialBody={siteInfo?.fontBody ?? null}
            brand={BRAND_EYEBROW}
          />
        </div>
      </div>
    </div>
  );
}
