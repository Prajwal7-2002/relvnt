import "./globals.css";

export const metadata = {
  title: "RELVNT // Quantitative Distribution Sentinel",
  description:
    "Enterprise Early-Warning Radar for Algorithmic Suppression and Ad Fatigue. Zero-Data-Leak Local Diagnostic Engine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
