"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useMeQuery } from "@/features/auth-login";

type GuestOnlyProps = {
  children: ReactNode;
  redirectTo?: string;
};

export function GuestOnly({
  children,
  redirectTo = "/",
}: GuestOnlyProps) {
  const router = useRouter();
  const { data: me, isLoading } = useMeQuery();

  useEffect(() => {
    if (me) {
      router.replace(redirectTo);
    }
  }, [me, redirectTo, router]);

  if (isLoading || me) {
    return (
      <div className="w-full max-w-md rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-4 w-24 rounded-full bg-neutral-200" />
          <div className="mx-auto h-8 w-32 rounded-2xl bg-neutral-200" />
          <div className="h-12 rounded-2xl bg-neutral-200" />
          <div className="h-12 rounded-2xl bg-neutral-200" />
          <div className="h-12 rounded-2xl bg-neutral-200" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
