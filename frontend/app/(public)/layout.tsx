import { publicApi } from "@/lib/api/public";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TopButton from "../components/TopButton";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteInfo = await publicApi.getSiteInfo();

  return (
    <>
      <Header instagramUrl={siteInfo?.instagramUrl ?? null} />
      <main className="flex-1">{children}</main>
      <Footer />
      <TopButton />
    </>
  );
}
