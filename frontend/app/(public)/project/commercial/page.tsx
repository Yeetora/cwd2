import type { Metadata } from "next";
import CategoryListPage from "@/app/components/portfolio/CategoryListPage";

export const metadata: Metadata = { title: "상업공간 | Project" };

export default async function CommercialPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <CategoryListPage category="COMMERCIAL" page={Math.max(0, Number(page ?? 0) || 0)} />;
}
