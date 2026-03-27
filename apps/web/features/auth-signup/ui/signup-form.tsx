"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signup } from "@/entities/session";
import { ApiError } from "@/shared/api";
import { Button } from "@/shared/ui";
import { signupFormSchema, type SignupFormValues } from "../model";

export function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      nickname: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      clearErrors("root");
      toast.success("회원가입이 완료되었습니다. 로그인해 주세요.");
      router.push("/login");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setError("root", { message: error.message });
        toast.error(error.message);
        return;
      }

      const message = "회원가입 중 문제가 발생했습니다.";
      setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    clearErrors("root");
    await signupMutation.mutateAsync({
      nickname: values.nickname,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <section className="space-y-5">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            닉네임
          </span>
          <input
            type="text"
            {...register("nickname")}
            className="h-12 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:bg-white"
            placeholder="닉네임을 입력하세요"
            autoComplete="nickname"
          />
          {errors.nickname ? (
            <p className="mt-2 text-sm text-rose-600">
              {errors.nickname.message}
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            이메일
          </span>
          <input
            type="email"
            {...register("email")}
            className="h-12 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:bg-white"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email ? (
            <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            비밀번호
          </span>
          <input
            type="password"
            {...register("password")}
            className="h-12 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:bg-white"
            placeholder="비밀번호를 입력하세요"
            autoComplete="new-password"
          />
          {errors.password ? (
            <p className="mt-2 text-sm text-rose-600">
              {errors.password.message}
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            비밀번호 확인
          </span>
          <input
            type="password"
            {...register("passwordConfirm")}
            className="h-12 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:bg-white"
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
          />
          {errors.passwordConfirm ? (
            <p className="mt-2 text-sm text-rose-600">
              {errors.passwordConfirm.message}
            </p>
          ) : null}
        </label>

        <Button
          type="submit"
          size="lg"
          disabled={signupMutation.isPending}
          className="h-12 w-full rounded-2xl bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          {signupMutation.isPending ? "회원가입 중..." : "회원가입"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600">
        이미 계정이 있나요?{" "}
        <Link
          href="/login"
          className="font-semibold text-neutral-950 underline underline-offset-4"
        >
          로그인
        </Link>
      </p>
    </section>
  );
}
