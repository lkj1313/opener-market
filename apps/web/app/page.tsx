import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f6f1e8_0%,#f7fbff_100%)] px-6 py-16">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
        <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Opener Market
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-neutral-950 md:text-6xl">
                루트 페이지는 로그인보다 상품 홈에 가까워야 합니다.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-600 md:text-lg">
                로그인은 전용 페이지로 분리하고, 이 화면은 앞으로 상품 목록,
                검색, 프로모션, 배너가 들어가는 실제 커머스 메인으로 바꿔갈
                예정입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                로그인하러 가기
              </Link>
              <div className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-600">
                다음 단계는 상품 홈 구성
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-neutral-950 p-6 text-white">
              <p className="text-sm text-white/70">현재</p>
              <p className="mt-3 text-2xl font-semibold">로그인 전용 라우트 분리</p>
              <p className="mt-2 text-sm leading-6 text-white/75">
                인증 화면이 루트 페이지를 차지하지 않고 별도 경로에서 동작합니다.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6">
              <p className="text-sm text-neutral-500">다음</p>
              <p className="mt-3 text-2xl font-semibold text-neutral-950">
                상품 목록과 검색
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                이 페이지는 이제 실제 커머스 랜딩 화면으로 확장할 준비가 된 상태입니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
