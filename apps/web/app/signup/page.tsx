import { GuestOnly } from "@/features/auth-guard";
import { SignupForm } from "@/features/auth-signup";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-6 py-16">
      <GuestOnly>
        <main className="w-full max-w-md space-y-6 rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium tracking-[0.18em] text-neutral-500">
              OPENER MARKET
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
              회원가입
            </h1>
          </div>

          <SignupForm />
        </main>
      </GuestOnly>
    </div>
  );
}
