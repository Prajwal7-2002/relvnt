import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME, contactLabel, contactLink } from "../../../lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link href="/" className="site-brand" aria-label={`${SITE_NAME} home`}>
          relvnt<span>.</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/sample-report">Sample report</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/app" className="site-nav-app">
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer-inner">
        <div>
          <div className="site-brand site-brand-small">
            relvnt<span>.</span>
          </div>
          <p>Early warning for Instagram and Meta Ads performance, for agencies and local businesses in India.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/sample-report">Sample report</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href={contactLink()}>{contactLabel()}</a>
          {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}
        </nav>
      </div>
      <div className="site-container site-footer-legal">© {new Date().getFullYear()} {SITE_NAME}</div>
    </footer>
  );
}
