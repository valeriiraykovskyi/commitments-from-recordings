import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Open_Sans } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

// Codebridge sets body text in Open Sans and every heading and button in Montserrat.
const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commitments from recordings",
  description:
    "Agreed tasks, owners, deadlines and open questions from a recorded project discussion, each with a timestamped quote.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
