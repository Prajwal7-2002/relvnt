import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/site/SiteChrome";

export default function NotFound() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="site-section">
        <div className="site-container site-center">
          <h1 className="site-page-title">Page not found</h1>
          <p className="site-lead">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <div className="site-cta-row site-center-row">
            <Link className="site-btn site-btn-primary" href="/">
              Go to the home page
            </Link>
            <Link className="site-btn site-btn-secondary" href="/app">
              Open the app
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
