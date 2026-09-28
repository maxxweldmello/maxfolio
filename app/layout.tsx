import type { Metadata } from "next";
import { Fraunces, Inter, Anton } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import ScrollProgress from "@/components/ScrollProgress";
import PageLoader from "@/components/PageLoader";
import { ThemeProvider } from "@/components/ThemeProvider";

const siteUrl = "https://maxxwel.dev";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maxwel D'Mello — Software Engineer",
    template: "%s · Maxwel D'Mello",
  },
  description:
    "Software engineer building systems end to end — database design, Spring Boot services, Next.js frontends. Case notes from production work on payments, onboarding, and platform tooling.",
  authors: [{ name: "Maxwel D'Mello" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Maxwel D'Mello",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${anton.variable}`}
      // the pre-hydration script below sets data-theme on <html> from
      // localStorage before React hydrates, which will never match what
      // the server rendered (it doesn't know the visitor's stored theme) —
      // this is the documented fix for that exact case, not a real mismatch.
      suppressHydrationWarning
    >
      <body>
        {/* runs before hydration — stops the browser restoring a remembered
            scroll position on reload, ahead of any React effect */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; }`,
          }}
        />
        {/* applies the saved theme to <html> before paint — avoids a
            flash of the wrong theme on load. ThemeProvider takes over
            from here once React hydrates. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try { if (localStorage.getItem("site-theme") === "dark") document.documentElement.setAttribute("data-theme", "dark"); } catch (e) {}`,
          }}
        />
        <ThemeProvider>
          <PageLoader />
          <Nav />
          <ScrollProgress />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
