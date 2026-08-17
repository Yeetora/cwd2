import Link from "next/link";
import { cookies } from "next/headers";
import { serverApiBase } from "@/lib/api/client";
import type { PageResponse, PortfolioListItem } from "@/lib/api/types";

async function fetchCount(cookieHeader: string): Promise<number | null> {
  try {
    const res = await fetch(`${serverApiBase()}/api/admin/portfolios?size=1`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PageResponse<PortfolioListItem>;
    return json.totalElements;
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const portfolioCount = await fetchCount(cookieHeader);

  return (
    <div>
      <h1 className="text-2xl font-light">대시보드</h1>
      <p className="mt-2 text-sm text-neutral-500">관리 화면입니다.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashCard
          title="포트폴리오"
          value={portfolioCount == null ? "—" : String(portfolioCount)}
          link={{ href: "/admin/portfolio", label: "관리하기 →" }}
        />
        <DashCard title="문의" value="—" hint="Phase G 후 활성화" />
      </div>
    </div>
  );
}

function DashCard({
  title,
  value,
  hint,
  link,
}: {
  title: string;
  value: string;
  hint?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="border border-neutral-200 bg-white p-6">
      <div className="text-xs tracking-[0.2em] text-neutral-500">{title}</div>
      <div className="mt-3 text-3xl font-light">{value}</div>
      {hint && <p className="mt-2 text-xs text-neutral-400">{hint}</p>}
      {link && (
        <Link href={link.href} className="mt-4 inline-block text-sm hover:underline">
          {link.label}
        </Link>
      )}
    </div>
  );
}
