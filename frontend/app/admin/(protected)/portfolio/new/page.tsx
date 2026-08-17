import type { Metadata } from "next";
import PortfolioForm from "../PortfolioForm";

export const metadata: Metadata = {
  title: "포트폴리오 등록",
  robots: { index: false, follow: false },
};

export default function NewPortfolioPage() {
  return (
    <div>
      <h1 className="text-2xl font-light">포트폴리오 등록</h1>
      <p className="mt-2 text-sm text-neutral-500">
        먼저 기본 정보를 저장하면 이미지 업로드 화면으로 이동합니다.
      </p>

      <div className="mt-8">
        <PortfolioForm mode="create" />
      </div>
    </div>
  );
}
