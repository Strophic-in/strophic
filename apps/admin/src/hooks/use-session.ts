"use client";

import type { SessionUser } from "@strophic/api-client";
import type { LoginInput } from "@strophic/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSession() {
  return useQuery<SessionUser>({
    queryKey: ["session"],
    queryFn: async () => (await api.me()).user,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (data) => qc.setQueryData(["session"], data.user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      qc.setQueryData(["session"], null);
      qc.clear();
    },
  });
}
