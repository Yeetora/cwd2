import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminInfo } from "@/lib/api/types";
import { serverApiBase } from "@/lib/api/client";
import { publicApi } from "@/lib/api/public";
import AdminTopbar from "../components/AdminTopbar";

async function fetchMe(cookieHeader: string): Promise<AdminInfo | null> {
  try {
    const res = await fetch(`${serverApiBase()}/api/admin/auth/me`, {
      headers: { Cookie: cookieHeader, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminInfo;
  } catch {
    return null;
  }
}

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const [me, siteInfo] = await Promise.all([
    fetchMe(cookieHeader),
    publicApi.getSiteInfo().catch(() => null),
  ]);
  if (!me) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <AdminTopbar me={me} logoUrl={siteInfo?.logoUrl ?? null} />
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
