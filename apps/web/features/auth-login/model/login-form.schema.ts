import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 형식을 입력해 주세요."),
  password: z
    .string()
    .trim()
    .min(1, "비밀번호를 입력해 주세요.")
    .max(100, "비밀번호는 100자 이하로 입력해 주세요."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
