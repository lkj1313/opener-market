"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/entities/user";

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled,
    retry: false,
  });
}
