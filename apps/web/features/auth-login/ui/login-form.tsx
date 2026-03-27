"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { login } from "@/entities/session";
import { ApiError } from "@/shared/api";
import { Button } from "@/shared/ui";
import { loginFormSchema, type LoginFormValues } from "../model";

export function LoginForm() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      clearErrors("root");
      toast.success("로그인되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setError("root", { message: error.message });
        toast.error(error.message);
        return;
      }

      const message = "로그인 중 문제가 발생했습니다.";
      setError("root", { message });
      toast.error(message);
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    clearErrors("root");

    try {
      await loginMutation.mutateAsync(values);
    } catch {
      // Handled in onError.
    }
  };

  return (
    <section className="space-y-5">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
            autoComplete="current-password"
          />
          {errors.password ? (
            <p className="mt-2 text-sm text-rose-600">
              {errors.password.message}
            </p>
          ) : null}
        </label>

        <Button
          type="submit"
          size="lg"
          disabled={loginMutation.isPending}
          className="h-12 w-full rounded-2xl bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </section>
  );
}
