"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { AppRealtimeBridge } from "@/components/providers/AppRealtimeBridge";

export function QueryProvider(props: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AppRealtimeBridge />
      {props.children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

