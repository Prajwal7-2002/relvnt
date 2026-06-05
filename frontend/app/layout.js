import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Relvnt",
  description: "Instagram reach intelligence"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0F0F0F] text-white`}>
        {children}
      </body>
    </html>
  );
}
