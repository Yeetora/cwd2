import Image from "next/image";
import Link from "next/link";
import { publicApi } from "@/lib/api/public";

export default async function Footer() {
  const siteInfo = await publicApi.getSiteInfo();

  const phone = siteInfo?.companyPhone ?? null;
  const email = siteInfo?.companyEmail ?? null;
  const address = siteInfo?.companyAddress ?? null;
  const hours = siteInfo?.businessHours ?? null;

  return (
    <footer className="mt-24 bg-[linear-gradient(to_bottom,var(--background)_0%,var(--surface-warm)_40%,var(--surface-warm)_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Image
              src="/logo.png"
              alt="cwd2"
              width={1536}
              height={1024}
              className="h-32 w-auto"
            />
          </div>

          <div className="text-sm">
            <div className="font-medium">Contact</div>
            <ul className="mt-3 space-y-1 text-muted">
              {phone && <li>전화: {phone}</li>}
              {email && <li>이메일: {email}</li>}
              {address && <li>주소: {address}</li>}
              {hours && <li>운영시간: {hours}</li>}
              {!phone && !email && !address && !hours && (
                <li className="text-muted/60">연락처 정보 미설정</li>
              )}
            </ul>
          </div>

          <div className="text-sm">
            <div className="font-medium">Menu</div>
            <ul className="mt-3 space-y-1 text-muted">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/project/residential" className="hover:text-foreground">주거공간</Link></li>
              <li><Link href="/project/commercial" className="hover:text-foreground">상업공간</Link></li>
              <li><Link href="/process" className="hover:text-foreground">Process</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border-warm pt-6 text-xs text-muted">
          © {new Date().getFullYear()} cwd2. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
