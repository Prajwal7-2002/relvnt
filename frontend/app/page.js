import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/site/SiteChrome";
import { contactLink } from "../lib/site";

export const metadata = {
  title: "Relvnt: know when your Instagram starts slipping",
  description:
    "Relvnt compares every day with what is normal for your account, flags drops early, and gives you a one-page report with what to change.",
};

const CHECKUP_MESSAGE = "Hi! I'd like a free Instagram check-up. My handle is @";

export default function LandingPage() {
  return (
    <div className="site">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="site-hero">
          <div className="site-container site-hero-inner">
            <div className="site-hero-copy">
              <h1>Spot an Instagram slowdown early, and know exactly what to fix.</h1>
              <p className="site-lead">
                Relvnt compares every day with what&apos;s normal for your account, flags drops before they become a problem,
                and turns the numbers into a one-page report with what to change this week.
              </p>
              <div className="site-cta-row">
                <a className="site-btn site-btn-primary" href={contactLink(CHECKUP_MESSAGE)}>
                  Get a free check-up
                </a>
                <Link className="site-btn site-btn-secondary" href="/sample-report">
                  See a sample report
                </Link>
              </div>
              <p className="site-fineprint">No passwords needed · Works from your Meta Business Suite export · Instagram and Meta Ads</p>
            </div>
            <figure className="site-hero-shot">
              <img src="/screens/analysis.png" alt="Relvnt analysis of an Instagram account: reach 47% below usual, with before and after numbers" width="1440" height="880" />
            </figure>
          </div>
        </section>

        {/* Problem */}
        <section className="site-section">
          <div className="site-container">
            <h2 className="site-h2">Reach rarely crashes overnight. It slips, quietly.</h2>
            <div className="site-grid-3">
              <div className="site-card">
                <h3>Drops go unnoticed</h3>
                <p>Views fall a little each week. By the time it&apos;s obvious, enquiries and orders have already slowed down.</p>
              </div>
              <div className="site-card">
                <h3>Dashboards show what, not why</h3>
                <p>Instagram Insights tells you the numbers. It doesn&apos;t tell you that you posted half as many reels this month.</p>
              </div>
              <div className="site-card">
                <h3>Clients notice first</h3>
                <p>For agencies, the worst way to find a problem is a client asking about it. Early warning gives you time to act.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="site-section site-section-alt">
          <div className="site-container">
            <h2 className="site-h2">How it works</h2>
            <ol className="site-steps">
              <li>
                <span>1</span>
                <h3>Send an export</h3>
                <p>
                  In Meta Business Suite: Insights → Content → Export. It takes two minutes, and we never need your password.
                </p>
              </li>
              <li>
                <span>2</span>
                <h3>We compare and flag</h3>
                <p>Each day is compared with what&apos;s usual for that weekday on your account. One-off viral spikes don&apos;t distort it.</p>
              </li>
              <li>
                <span>3</span>
                <h3>You get a one-page report</h3>
                <p>What changed, what the numbers show about why, and three specific things to do this week.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* What's in the audit */}
        <section className="site-section">
          <div className="site-container site-split">
            <div>
              <h2 className="site-h2">Every point comes with the numbers behind it</h2>
              <ul className="site-checklist">
                <li>Health score and how far reach is from normal</li>
                <li>Before and after: reach per post, posts per week, best format</li>
                <li>Posting calendar showing gaps and weak weeks</li>
                <li>Which formats work best for your account: reels, carousels or photos</li>
                <li>Best and weakest posts, and the days that dipped</li>
                <li>Three clear actions for the coming week</li>
              </ul>
              <Link className="site-link" href="/sample-report">
                Read a full sample report →
              </Link>
            </div>
            <figure className="site-shot">
              <img src="/screens/report.png" alt="A one-page Relvnt report with findings and recommended actions" width="794" height="1066" />
            </figure>
          </div>
        </section>

        {/* Who it's for */}
        <section className="site-section site-section-alt">
          <div className="site-container">
            <h2 className="site-h2">Built for people who run Instagram for a living</h2>
            <div className="site-grid-2">
              <div className="site-card">
                <h3>Agencies and freelancers</h3>
                <p>
                  See which clients need attention at a glance, and send each of them a branded report with your logo and
                  details. Catch a slowdown before the client does.
                </p>
              </div>
              <div className="site-card">
                <h3>Local businesses and creators</h3>
                <p>
                  Cafés, boutiques, salons, home bakers and coaches who sell through Instagram. Plain-language advice, sent on
                  WhatsApp, with no dashboards to learn.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Free snapshot */}
        <section className="site-section">
          <div className="site-container site-split site-split-reverse">
            <figure className="site-shot site-shot-narrow">
              <img src="/screens/snapshot.png" alt="A free check-up card: recent posts getting 65% fewer views" width="1080" height="1470" />
            </figure>
            <div>
              <h2 className="site-h2">Not sure yet? Start with a free snapshot</h2>
              <p className="site-text">
                Send us your Instagram handle. We&apos;ll look at the public view counts on your recent posts and send back a
                one-page snapshot: how recent posts compare with earlier ones, and which formats are doing best.
              </p>
              <a className="site-btn site-btn-primary" href={contactLink(CHECKUP_MESSAGE)}>
                Get a free snapshot
              </a>
            </div>
          </div>
        </section>

        {/* Honest promise */}
        <section className="site-section site-section-alt">
          <div className="site-container site-grid-2">
            <div className="site-card">
              <h3>What we promise</h3>
              <ul className="site-checklist">
                <li>The numbers behind every point we make</li>
                <li>A clear warning when performance drops</li>
                <li>Specific, practical things to try next</li>
              </ul>
            </div>
            <div className="site-card">
              <h3>What we don&apos;t</h3>
              <ul className="site-crosslist">
                <li>Guaranteed growth or follower numbers</li>
                <li>Access to your account or your password</li>
                <li>Claims about &quot;the algorithm&quot; that the data can&apos;t show</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="site-section">
          <div className="site-container site-narrow">
            <h2 className="site-h2">Questions</h2>
            <details className="site-faq">
              <summary>Do you need my Instagram password?</summary>
              <p>No. You export your insights from Meta Business Suite and send us the file. We never log in to your account.</p>
            </details>
            <details className="site-faq">
              <summary>Which platforms do you cover?</summary>
              <p>Instagram (posts and reels) and Meta Ads today. Other platforms may follow.</p>
            </details>
            <details className="site-faq">
              <summary>My account is small. Is it still useful?</summary>
              <p>
                Yes, as long as you post regularly. We need a few weeks of posts to compare. If there isn&apos;t enough data to
                say something reliable, we&apos;ll tell you rather than guess.
              </p>
            </details>
            <details className="site-faq">
              <summary>What happens to my data?</summary>
              <p>
                It&apos;s used only to prepare your report, never sold, and deleted on request. See the{" "}
                <Link href="/privacy">privacy policy</Link> for details.
              </p>
            </details>
          </div>
        </section>

        {/* Final CTA */}
        <section className="site-final">
          <div className="site-container">
            <h2>Find out how your account is really doing.</h2>
            <div className="site-cta-row">
              <a className="site-btn site-btn-gold" href={contactLink(CHECKUP_MESSAGE)}>
                Get a free check-up
              </a>
              <Link className="site-btn site-btn-ghost" href="/pricing">
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
