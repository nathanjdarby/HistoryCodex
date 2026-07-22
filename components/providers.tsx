"use client";

import { HydrationBoundary, QueryClientProvider, type DehydratedState } from "@tanstack/react-query";
import { NavChromeProvider } from "@/lib/client/nav-chrome";
import { ThemeProvider } from "@/lib/client/theme";
import { getQueryClient } from "@/lib/client/get-query-client";
import { CardLayoutsProvider } from "@/components/card-layouts-provider";

export function Providers({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <ThemeProvider>
          <CardLayoutsProvider>
            <NavChromeProvider>{children}</NavChromeProvider>
          </CardLayoutsProvider>
        </ThemeProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
