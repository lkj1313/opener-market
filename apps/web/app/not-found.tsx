import Link from "next/link";
import { Button } from "@/shared/ui";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-6 py-16">
      <main className="w-full max-w-md space-y-6 rounded-[2rem] border border-black/8 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-[0.18em] text-neutral-500">
            OPENER MARKET
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-sm leading-6 text-neutral-600">
            요청한 주소가 없거나 이동되었을 수 있습니다. 홈으로 돌아가 다시
            탐색해 주세요.
          </p>
        </div>

        <Button
          render={
            <Link href="/" />
          }
          size="lg"
          className="h-12 w-full rounded-2xl"
        >
          홈으로 이동
        </Button>
      </main>
    </div>
  );
}
