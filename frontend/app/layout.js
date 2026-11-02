import "./globals.css";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
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
