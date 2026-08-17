import Header from "../components/Header";
import Footer from "../components/Footer";
import TopButton from "../components/TopButton";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <TopButton />
    </>
  );
}
