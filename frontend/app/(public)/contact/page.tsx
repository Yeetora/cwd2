import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
      <p className="text-xs tracking-[0.3em] text-muted">CONTACT</p>
      <h1 className="mt-4 text-3xl font-light md:text-4xl">문의하기</h1>
      <p className="mt-4 max-w-2xl text-muted">
        프로젝트에 대한 모든 문의는 아래 양식 또는 연락처로 부탁드립니다.
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_320px]">
        <ContactForm />

        <aside className="space-y-6 text-sm">
          <div>
            <div className="text-xs tracking-[0.2em] text-muted">PHONE</div>
            <div className="mt-2">000-0000-0000</div>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] text-muted">EMAIL</div>
            <div className="mt-2">hello@example.com</div>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] text-muted">ADDRESS</div>
            <div className="mt-2">서울시 ○○구 ○○로 ○○</div>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] text-muted">HOURS</div>
            <div className="mt-2">평일 10:00 – 18:00</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
