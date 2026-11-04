import { SiteFooter, SiteHeader } from "../components/site/SiteChrome";
import { CONTACT_EMAIL } from "../../lib/site";

export const metadata = {
  title: "Privacy policy · Relvnt",
  description: "What data Relvnt uses, why, where it goes, and how to have it deleted.",
};

const UPDATED = "4 November 2026";

export default function PrivacyPage() {
  const contact = CONTACT_EMAIL || "the email address on our website";
  return (
    <div className="site">
      <SiteHeader />
      <main className="site-section">
        <article className="site-container site-narrow site-legal">
          <h1 className="site-page-title">Privacy policy</h1>
          <p className="site-fineprint">Last updated {UPDATED}</p>

          <p>
            This policy explains what information Relvnt uses when we prepare performance check-ups and reports, why we use
            it, and the choices you have. We aim to follow India&apos;s Digital Personal Data Protection Act, 2023.
          </p>

          <h2>What we use</h2>
          <ul>
            <li>
              <strong>Files you send us</strong>, such as a Meta Business Suite or Meta Ads export. These usually contain dates,
              post types, reach, views, likes, comments, shares, saves, ad spend and results, post captions and post links.
            </li>
            <li>
              <strong>Public numbers</strong> you or we read from a public Instagram profile for a free snapshot, such as view
              counts on recent posts. We copy these by hand and do not scrape accounts.
            </li>
            <li>
              <strong>Your contact details</strong> when you message us, such as your name, phone number or email.
            </li>
            <li>
              <strong>Details entered in the app</strong>, such as your business name, logo and contact details for reports.
              These are stored in your own browser.
            </li>
          </ul>

          <h2>Why we use it</h2>
          <p>
            Only to prepare the check-ups and reports you ask for, and to reply to you. We do not sell your data, use it for
            advertising, or share it with other clients.
          </p>

          <h2>How it is processed</h2>
          <ul>
            <li>Files are analysed on our servers to produce your report. We do not keep uploaded files after the analysis.</li>
            <li>
              Short summaries of the results (for example the account name and health score) may be kept temporarily so they
              appear in your client list.
            </li>
            <li>
              To write findings in plain language, we may send computed summary numbers and findings (not your full file) to
              Google&apos;s Gemini API. Google processes this under its own terms.
            </li>
            <li>We use hosting providers to run the website and app.</li>
          </ul>

          <h2>How long we keep it</h2>
          <p>
            We keep what we need to deliver your report and answer follow-up questions, then delete it. You can ask us to
            delete your data at any time.
          </p>

          <h2>Your choices and rights</h2>
          <p>
            You can ask to see the data we hold about you, correct it, or delete it, and you can withdraw your consent at any
            time. Email {contact} and we will respond within a reasonable time. If you are not satisfied with our response, you
            may contact the Data Protection Board of India.
          </p>

          <h2>Children</h2>
          <p>Our services are meant for businesses and adults. We do not knowingly process data about children.</p>

          <h2>Changes</h2>
          <p>If we change this policy, we will update the date at the top of this page.</p>

          <h2>Contact</h2>
          <p>Questions or requests: {contact}.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
