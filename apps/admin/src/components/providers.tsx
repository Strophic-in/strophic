"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/api";

/**
 * Shows a "session ended" toast and returns to the login screen when the API
 * client reports an unrecoverable 401 (access token expired and refresh failed).
 */
function SessionExpiredBridge() {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    api.setOnSessionExpired(() => {
      toast.error("Session ended", {
        id: "session-expired", // dedupes if several requests fail at once
        description: "You've been signed out. Please log in again.",
      });
      qc.clear();
      router.replace("/login");
    });
    return () => api.setOnSessionExpired(undefined);
  }, [qc, router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <SessionExpiredBridge />
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
