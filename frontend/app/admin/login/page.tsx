import { publicApi } from "@/lib/api/public";
import SiteLogo from "@/app/components/SiteLogo";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const siteInfo = await publicApi.getSiteInfo().catch(() => null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <SiteLogo
            logoUrl={siteInfo?.logoUrl}
            priority
            defaultClassName="h-[45px] w-auto"
            uploadedClassName="h-[45px]"
          />
          <p className="mt-3 text-xs tracking-[0.3em] text-neutral-500">ADMIN</p>
          <h1 className="mt-2 text-2xl font-light">관리자 로그인</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
