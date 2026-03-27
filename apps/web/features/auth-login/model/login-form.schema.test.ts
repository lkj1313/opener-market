import { loginFormSchema } from "./login-form.schema";

describe("loginFormSchema", () => {
  it("유효한 이메일과 비밀번호를 통과시킨다", () => {
    const result = loginFormSchema.safeParse({
      email: "seller@example.com",
      password: "password123!",
    });

    expect(result.success).toBe(true);
  });

  it("이메일 형식이 잘못되면 에러를 반환한다", () => {
    const result = loginFormSchema.safeParse({
      email: "invalid-email",
      password: "password123!",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "올바른 이메일 형식을 입력해 주세요.",
      );
    }
  });

  it("비밀번호가 비어 있으면 에러를 반환한다", () => {
    const result = loginFormSchema.safeParse({
      email: "seller@example.com",
      password: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "비밀번호를 입력해 주세요.",
      );
    }
  });
});
