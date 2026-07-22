import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { dehydrate } from "@tanstack/react-query";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MainShell } from "@/components/main-shell";
import { NavHeader } from "@/components/nav-header";
import { CARD_LAYOUTS_QUERY_KEY } from "@/lib/client/card-layouts";
import { getQueryClient } from "@/lib/client/get-query-client";
import { cardAspectRatioCssProperties } from "@/lib/card-layout-styles";
import { getCardLayoutBundle } from "@/lib/server/card-layouts";
import { getServerThemePreference } from "@/lib/server/theme";
import { themeHtmlClass } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HistoryCodex — Read, collect, and play through history",
  description:
    "Turn history books into a living adventure. Track reading, collect characters and places, and battle through the ages.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const [cardLayoutBundle, theme] = await Promise.all([
    getCardLayoutBundle(),
    getServerThemePreference(),
  ]);
  queryClient.setQueryData(CARD_LAYOUTS_QUERY_KEY, cardLayoutBundle);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${themeHtmlClass(theme)} h-full antialiased`}
      style={{
        ...cardAspectRatioCssProperties(cardLayoutBundle.settings),
        colorScheme: theme,
      }}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers dehydratedState={dehydrate(queryClient)}>
          <NavHeader />
          <MainShell>{children}</MainShell>
        </Providers>
      </body>
    </html>
  );
}
