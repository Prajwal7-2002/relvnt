import { SiteFooter, SiteHeader } from "../components/site/SiteChrome";
import ClientReport from "../components/ClientReport";
import ReportActions from "./ReportActions";
import sample from "../../lib/sample-analysis.json";
import { CONTACT_EMAIL, contactLink } from "../../lib/site";

export const metadata = {
  title: "Sample report · Relvnt",
  description: "A real one-page Relvnt report for a sample café account, generated from a Business Suite export.",
};

const AGENCY = {
  name: "Relvnt",
  tagline: "Instagram performance check-ups",
  monogram: "R",
  auditorName: "The Relvnt team",
  role: "",
  contact: CONTACT_EMAIL,
};

export default function SampleReportPage() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="site-section">
        <div className="site-container site-sample-intro">
          <h1 className="site-page-title">A sample report</h1>
          <p className="site-lead site-center">
            This is the actual one-page report Relvnt produces, for a sample café account built from a Business Suite export
            of 57 posts. Every number comes from the data.
          </p>
          <div className="site-cta-row site-center-row">
            <a className="site-btn site-btn-primary" href={contactLink("Hi! I'd like a report like this for @")}>
              Get one for your account
            </a>
            <ReportActions />
          </div>
        </div>
        <div className="site-report-frame">
          <ClientReport data={sample} agency={AGENCY} screen />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
