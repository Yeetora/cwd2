import { publicApi } from "@/lib/api/public";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TopButton from "../components/TopButton";
import SiteFonts from "../components/SiteFonts";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteInfo = await publicApi.getSiteInfo();

  return (
    <SiteFonts fontHeading={siteInfo?.fontHeading} fontBody={siteInfo?.fontBody}>
      <Header instagramUrl={siteInfo?.instagramUrl ?? null} logoUrl={siteInfo?.logoUrl ?? null} />
      <main className="flex-1">{children}</main>
      <Footer />
      <TopButton />
    </SiteFonts>
  );
}
