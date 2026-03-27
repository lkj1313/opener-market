import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signup } from "@/entities/session";
import { renderWithQueryClient } from "@/test/test-utils";
import { SignupForm } from "./signup-form";

const mockPush = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock("@/entities/session", () => ({
  signup: jest.fn(),
}));

describe("SignupForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("비밀번호 확인 입력창에서 blur 시 불일치 에러를 보여준다", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<SignupForm />);

    await user.type(screen.getByLabelText("비밀번호"), "password123!");
    await user.type(
      screen.getByLabelText("비밀번호 확인"),
      "password999!",
    );
    await user.tab();

    expect(
      await screen.findByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("유효한 값으로 제출하면 signup을 호출하고 로그인 페이지로 이동한다", async () => {
    const user = userEvent.setup();
    const mockedSignup = jest.mocked(signup);
    mockedSignup.mockResolvedValue({
      id: "user-1",
      email: "seller@example.com",
      nickname: "오프너",
      createdAt: new Date().toISOString(),
    });

    renderWithQueryClient(<SignupForm />);

    await user.type(screen.getByLabelText("닉네임"), "오프너");
    await user.type(screen.getByLabelText("이메일"), "seller@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123!");
    await user.type(
      screen.getByLabelText("비밀번호 확인"),
      "password123!",
    );
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() => {
      expect(mockedSignup).toHaveBeenCalled();
      expect(mockedSignup.mock.calls[0]?.[0]).toEqual({
        nickname: "오프너",
        email: "seller@example.com",
        password: "password123!",
      });
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "회원가입이 완료되었습니다. 로그인해 주세요.",
      );
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("회원가입 실패 시 에러 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    const mockedSignup = jest.mocked(signup);
    mockedSignup.mockRejectedValue(new Error("fail"));

    renderWithQueryClient(<SignupForm />);

    await user.type(screen.getByLabelText("닉네임"), "오프너");
    await user.type(screen.getByLabelText("이메일"), "seller@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123!");
    await user.type(
      screen.getByLabelText("비밀번호 확인"),
      "password123!",
    );
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "회원가입 중 문제가 발생했습니다.",
      );
    });
  });
});
