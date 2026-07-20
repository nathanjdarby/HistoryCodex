"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NavChromeProvider } from "@/lib/client/nav-chrome";
import { ThemeProvider } from "@/lib/client/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavChromeProvider>{children}</NavChromeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
