import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/site/SiteChrome";
import { contactLink } from "../../lib/site";

export const metadata = {
  title: "Pricing · Relvnt",
  description: "Free snapshot, one-time audit, or monthly monitoring for your Instagram and Meta Ads. Prices in INR.",
};

// Introductory prices: edit here to change them on the page
const PLANS = [
  {
    name: "Free snapshot",
    price: "₹0",
    unit: "",
    blurb: "A quick look from your public numbers.",
    features: ["One-page check-up image", "Recent posts vs earlier ones", "Which formats are doing best"],
    cta: "Get a free snapshot",
    message: "Hi! I'd like a free Instagram snapshot. My handle is @",
  },
  {
    name: "Full audit",
    price: "₹1,999",
    unit: "per account",
    blurb: "The complete picture of the last 90 days.",
    features: [
      "Health score and how far reach is from normal",
      "Why it changed: formats, posting rhythm, best days",
      "Best and weakest posts",
      "Branded one-page PDF report",
      "Three clear actions, explained on a short call or voice note",
    ],
    cta: "Book an audit",
    message: "Hi! I'd like a full Instagram audit. My handle is @",
    featured: true,
  },
  {
    name: "Monthly watch",
    price: "₹999",
    unit: "per account / month",
    blurb: "We keep an eye on it so you don't have to.",
    features: ["Monthly report", "A message when something drops", "What to try next, every time", "Cancel any time"],
    cta: "Start monthly watch",
    message: "Hi! I'm interested in monthly monitoring for @",
  },
];

export default function PricingPage() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="site-section">
        <div className="site-container">
          <h1 className="site-page-title">Simple pricing</h1>
          <p className="site-lead site-center">Start free. Pay only when the report is worth it to you.</p>

          <div className="site-pricing">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`site-plan ${plan.featured ? "site-plan-featured" : ""}`}>
                {plan.featured && <span className="site-plan-badge">Most popular</span>}
                <h2>{plan.name}</h2>
                <p className="site-plan-blurb">{plan.blurb}</p>
                <div className="site-plan-price">
                  <strong>{plan.price}</strong>
                  {plan.unit && <span>{plan.unit}</span>}
                </div>
                <ul className="site-checklist">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a className={`site-btn ${plan.featured ? "site-btn-primary" : "site-btn-secondary"}`} href={contactLink(plan.message)}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <div className="site-narrow site-pricing-notes">
            <p>
              <strong>Agencies with 5 or more accounts:</strong> message us for a combined price and reports branded with your
              logo.
            </p>
            <p>All prices are in Indian rupees. Pay by UPI. Introductory prices may change for new orders.</p>
            <p>
              Not sure which one you need? <Link href="/sample-report">See a sample report</Link> first.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
