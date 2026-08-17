"use client";

import { useEffect, useState } from "react";

export default function TopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      aria-label="페이지 최상단으로"
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center border border-border-warm bg-surface-warm/95 backdrop-blur text-foreground shadow-[0_4px_18px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-foreground hover:text-background md:bottom-8 md:right-8 ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 11V3" />
        <path d="M3 7l4-4 4 4" />
      </svg>
    </button>
  );
}
