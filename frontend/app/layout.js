import "./globals.css";
import "./shell.css";
import "./analysis.css";
import "./report.css";
import "./snapshot.css";
import localFont from "next/font/local";

// Self-hosted variable font (Fontsource) so builds never depend on Google Fonts
const sansFont = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

// Serif for page titles only
const serifFont = localFont({
  src: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  variable: "--font-serif",
  weight: "100 900",
  display: "swap",
});

export const metadata = {
  title: "Relvnt: Reach monitoring for agencies",
  description:
    "Relvnt watches your clients' Instagram and Meta Ads performance and tells you when reach drops, before your clients notice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
