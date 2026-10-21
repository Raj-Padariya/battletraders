import SiteFooter from "@site/components/SiteFooter";
import SiteHeader from "@site/components/SiteHeader";
import Ticker from "@site/components/Ticker";
import "@site/styles/pages.css";

// Every public page except login/signup: ticker above the header, page content, footer.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Ticker />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
