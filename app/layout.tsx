import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientShell } from "@/components/layout/client-shell";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────
// DM Sans is a variable font: omitting `weight` ships one file for 400–800.

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// ─── Site config (env with safe fallbacks) ────────────────────────────────────

const APP = process.env.NEXT_PUBLIC_APP_NAME || "Mag Shoppy Sneakers";
const BRAND = process.env.NEXT_PUBLIC_BRAND_DESC;
const PRODUCT = process.env.NEXT_PUBLIC_PRODUCT_DESC;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const OG_IMAGE = process.env.NEXT_PUBLIC_OG_IMAGE || "/default-og.jpg";

const TITLE = BRAND ? `${APP} | ${BRAND}` : APP;
const DESCRIPTION =
  [
    BRAND && `${APP} is ${BRAND}.`,
    PRODUCT && `Shop ${PRODUCT} at affordable prices.`,
  ]
    .filter(Boolean)
    .join(" ") || `Shop online at ${APP}.`;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: TITLE, template: `%s | ${APP}` },
  description: DESCRIPTION,
  authors: [{ name: APP, url: BASE_URL }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: APP,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: APP }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${sans.variable} flex min-h-[100svh] flex-col bg-white font-sans text-base font-medium text-black antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-full focus-visible:bg-black focus-visible:px-5 focus-visible:py-3 focus-visible:text-sm focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Skip to content
        </a>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientShell>{children}</ClientShell>
          <Toaster
            position="top-center"
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  "flex w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-black shadow-lg sm:w-[356px]",
                title: "font-semibold",
                description: "text-neutral-500",
                actionButton:
                  "ml-auto rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700",
                closeButton: "text-neutral-500 hover:text-black",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}