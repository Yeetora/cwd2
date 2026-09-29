import Image from "next/image";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="ARTY INTERIOR"
            width={1606}
            height={414}
            priority
            className="h-[45px] w-auto"
          />
          <p className="mt-3 text-xs tracking-[0.3em] text-neutral-500">ADMIN</p>
          <h1 className="mt-2 text-2xl font-light">관리자 로그인</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
