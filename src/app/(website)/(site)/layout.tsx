import SiteFooter from "@site/components/SiteFooter";
import SiteHeader from "@site/components/SiteHeader";
import "@site/styles/pages.css";

// Every public page except login/signup: header, page content, footer.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
