"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Project",
    href: "/project",
    children: [
      { label: "주거공간", href: "/project/residential" },
      { label: "상업공간", href: "/project/commercial" },
    ],
  },
  { label: "Process", href: "/process" },
  { label: "Contact", href: "/contact" },
] as const;

const INSTAGRAM_URL = "https://instagram.com/studio_chauda";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <span className="relative inline-block">
      {/* 폭 reservation — bold 버전 크기로 공간 확보, 가로 흔들림 방지 */}
      <span aria-hidden className="invisible font-semibold tracking-wide">
        {label}
      </span>
      <span
        className={`absolute inset-0 font-normal transition-opacity duration-300 ${
          active ? "opacity-0" : "opacity-100"
        }`}
      >
        {label}
      </span>
      <span
        className={`absolute inset-0 font-semibold tracking-wide transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  // 경로 변경 시 모바일 메뉴 닫기 — 정당한 케이스
  useEffect(() => {
    setOpen(false);
    setProjectOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const delta = current - lastY;
        if (current < 80) {
          setHidden(false);
        } else if (Math.abs(delta) > 6) {
          setHidden(delta > 0);
        }
        lastY = current;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu가 열려있으면 항상 노출
  const shouldHide = hidden && !open;

  return (
    <>
    <header
      className={`sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur transition-transform duration-300 ${
        shouldHide ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex h-28 max-w-7xl items-center justify-between px-4 md:h-40 md:px-8">
        <Link href="/" className="flex items-center" aria-label="ARTY INTERIOR 홈으로">
          <Image
            src="/logo.png"
            alt="ARTY INTERIOR"
            width={1606}
            height={414}
            priority
            className="h-8 w-auto md:h-[45px]"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV_ITEMS.map((item) =>
            "children" in item ? (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href}
                  className="block py-2 transition-colors duration-300 hover:text-accent"
                >
                  <NavLabel label={item.label} active={isActive(pathname, item.href)} />
                </Link>
                <div
                  className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100"
                >
                  <div className="min-w-[160px] bg-surface-alt/95 backdrop-blur py-2 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="block px-5 py-2.5 text-center text-[13px] text-neutral-700 transition-colors hover:text-foreground"
                      >
                        <NavLabel label={c.label} active={isActive(pathname, c.href)} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors duration-300 hover:text-accent"
              >
                <NavLabel label={item.label} active={isActive(pathname, item.href)} />
              </Link>
            )
          )}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-300 hover:text-accent"
          >
            <NavLabel label="Instagram" active={false} />
          </a>
        </nav>

        <button
          type="button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex h-10 w-10 items-center justify-center"
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 h-px w-6 bg-foreground transition-transform ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-foreground transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-px w-6 bg-foreground transition-transform ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </div>
    </header>

    {/* 모바일 메뉴 오버레이 — header 외부에 두어야 header transform 영향 안 받음 */}
    {open && (
        <div className="md:hidden fixed inset-x-0 top-28 bottom-0 z-50 overflow-y-auto bg-surface-alt">
          <nav className="flex flex-col px-4 py-6 text-base">
            {NAV_ITEMS.map((item) =>
              "children" in item ? (
                <div key={item.label} className="border-b border-border-alt">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-4"
                    onClick={() => setProjectOpen((v) => !v)}
                    aria-expanded={projectOpen}
                  >
                    <span className={isActive(pathname, item.href) ? "font-semibold" : ""}>
                      {item.label}
                    </span>
                    <span className="text-muted">{projectOpen ? "−" : "+"}</span>
                  </button>
                  {projectOpen && (
                    <div className="pb-4 pl-4">
                      {item.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`block py-2 transition-colors duration-300 ${
                            isActive(pathname, c.href) ? "font-semibold text-foreground" : "text-muted"
                          }`}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border-b border-border-alt py-4 transition-colors duration-300 ${
                    isActive(pathname, item.href) ? "font-semibold" : ""
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-border-alt py-4"
            >
              Instagram
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
