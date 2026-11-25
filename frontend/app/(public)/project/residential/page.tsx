import type { Metadata } from "next";
import CategoryListPage from "@/app/components/portfolio/CategoryListPage";

export const metadata: Metadata = { title: "주거공간 | Project" };

export default async function ResidentialPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <CategoryListPage category="RESIDENTIAL" page={Math.max(0, Number(page ?? 0) || 0)} />;
}
