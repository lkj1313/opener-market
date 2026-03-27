"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/shared/ui";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-6 py-16">
      <main className="w-full max-w-md space-y-6 rounded-[2rem] border border-black/8 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-[0.18em] text-neutral-500">
            OPENER MARKET
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            문제가 발생했습니다
          </h1>
          <p className="text-sm leading-6 text-neutral-600">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 홈으로 이동해 다시
            접근할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            onClick={() => reset()}
            className="h-12 rounded-2xl"
          >
            다시 시도
          </Button>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className:
                "flex h-12 items-center justify-center rounded-2xl border-black/10 bg-white",
            })}
          >
            홈으로 이동
          </Link>
        </div>
      </main>
    </div>
  );
}
