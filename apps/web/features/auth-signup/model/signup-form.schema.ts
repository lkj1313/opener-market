import { z } from "zod";

export const signupFormSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(2, "닉네임은 2자 이상 입력해 주세요.")
      .max(8, "닉네임은 8자 이하로 입력해 주세요."),
    email: z
      .string()
      .trim()
      .min(1, "이메일을 입력해 주세요.")
      .email("올바른 이메일 형식을 입력해 주세요."),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상 입력해 주세요.")
      .max(100, "비밀번호는 100자 이하로 입력해 주세요.")
      .regex(/[^A-Za-z0-9]/, "비밀번호에 특수문자를 1개 이상 포함해 주세요."),
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해 주세요."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;
