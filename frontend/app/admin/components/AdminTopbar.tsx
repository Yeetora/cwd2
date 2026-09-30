"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminInfo } from "@/lib/api/types";
import { adminApi } from "@/lib/api/admin";

const NAV = [
  { label: "대시보드", href: "/admin" },
  { label: "포트폴리오", href: "/admin/portfolio" },
  { label: "사이트 설정", href: "/admin/site-info" },
  { label: "견적 설정", href: "/admin/estimate" },
  { label: "문의", href: "/admin/inquiries" },
];

export default function AdminTopbar({ me }: { me: AdminInfo }) {
  const router = useRouter();

  async function onLogout() {
    try {
      await adminApi.logout();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2" aria-label="ADMIN 대시보드">
            <Image
              src="/logo.png"
              alt="ARTY INTERIOR"
              width={1606}
              height={414}
              priority
              className="h-[22px] w-auto"
            />
            <span className="text-xs tracking-[0.2em] text-neutral-500">ADMIN</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-500 hidden sm:inline">{me.username}</span>
          <button
            onClick={onLogout}
            className="border border-neutral-300 px-3 py-1 hover:bg-neutral-100"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
