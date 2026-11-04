import { SiteFooter, SiteHeader } from "../components/site/SiteChrome";
import { CONTACT_EMAIL } from "../../lib/site";

export const metadata = {
  title: "Terms of service · Relvnt",
  description: "The terms for using Relvnt's check-ups, audits and monitoring.",
};

const UPDATED = "4 November 2026";

export default function TermsPage() {
  const contact = CONTACT_EMAIL || "the email address on our website";
  return (
    <div className="site">
      <SiteHeader />
      <main className="site-section">
        <article className="site-container site-narrow site-legal">
          <h1 className="site-page-title">Terms of service</h1>
          <p className="site-fineprint">Last updated {UPDATED}</p>

          <h2>What we provide</h2>
          <p>
            Relvnt provides performance check-ups, audits and monitoring for Instagram and Meta Ads, based on data you share
            with us or that is publicly visible. Reports describe what the data shows and suggest things to try.
          </p>

          <h2>No guaranteed results</h2>
          <p>
            Social media and advertising performance depends on many things outside our control. We do not guarantee any
            increase in reach, followers, sales or ad results. Our findings describe what happened at the same time as a
            change; they are not proof of what caused it.
          </p>

          <h2>Your data</h2>
          <p>
            You confirm that you have the right to share any data you send us, including data about your clients&apos;
            accounts. How we handle it is described in our privacy policy.
          </p>

          <h2>Payment</h2>
          <p>
            Prices are shown in Indian rupees on our pricing page or agreed with you before work starts. Payment is made by UPI
            or another method we agree. Monthly plans can be cancelled at any time and stop at the end of the paid month.
          </p>

          <h2>Refunds</h2>
          <p>
            If we cannot deliver a paid report, for example because the data is not sufficient, we will tell you and refund
            the amount paid for it.
          </p>

          <h2>Using the reports</h2>
          <p>
            Reports we prepare for you are yours to use and share, including with your own clients under your brand.
          </p>

          <h2>Liability</h2>
          <p>
            Our total liability for any claim relating to our services is limited to the amount you paid us for the service
            concerned.
          </p>

          <h2>Governing law</h2>
          <p>These terms are governed by the laws of India.</p>

          <h2>Contact</h2>
          <p>Questions about these terms: {contact}.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
