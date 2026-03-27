import { signupFormSchema } from "./signup-form.schema";

describe("signupFormSchema", () => {
  it("유효한 회원가입 값을 통과시킨다", () => {
    const result = signupFormSchema.safeParse({
      nickname: "오프너",
      email: "seller@example.com",
      password: "password123!",
      passwordConfirm: "password123!",
    });

    expect(result.success).toBe(true);
  });

  it("닉네임이 너무 짧으면 에러를 반환한다", () => {
    const result = signupFormSchema.safeParse({
      nickname: "a",
      email: "seller@example.com",
      password: "password123!",
      passwordConfirm: "password123!",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.nickname).toContain(
        "닉네임은 2자 이상 입력해 주세요.",
      );
    }
  });

  it("비밀번호에 특수문자가 없으면 에러를 반환한다", () => {
    const result = signupFormSchema.safeParse({
      nickname: "오프너",
      email: "seller@example.com",
      password: "password1234",
      passwordConfirm: "password1234",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "비밀번호에 특수문자를 1개 이상 포함해 주세요.",
      );
    }
  });

  it("비밀번호 확인이 다르면 에러를 반환한다", () => {
    const result = signupFormSchema.safeParse({
      nickname: "오프너",
      email: "seller@example.com",
      password: "password123!",
      passwordConfirm: "password999!",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.passwordConfirm).toContain(
        "비밀번호가 일치하지 않습니다.",
      );
    }
  });
});
