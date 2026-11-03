import "./globals.css";
import localFont from "next/font/local";

// Self-hosted variable fonts (Fontsource) so builds never depend on Google Fonts
const displayFont = localFont({
  src: "../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "200 800",
  display: "swap",
});

const monoFont = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata = {
  title: "relvnt. — Algorithmic Relevance & Distribution Early-Warning Radar",
  description:
    "Presentation-grade algorithmic intelligence platform. Early detection of social feed suppression, ad fatigue, and reach decoupling with 72-hour turnaround directives.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
