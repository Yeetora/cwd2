import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의 관리",
  robots: { index: false, follow: false },
};

export default function AdminInquiriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-light">문의 관리</h1>
      <p className="mt-4 text-sm text-neutral-500">
        Phase G에서 백엔드 문의 API가 구현된 후 본 페이지가 활성화됩니다.
      </p>
    </div>
  );
}
