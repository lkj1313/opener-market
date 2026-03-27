import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { login } from "@/entities/session";
import { renderWithQueryClient } from "@/test/test-utils";
import { LoginForm } from "./login-form";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock("@/entities/session", () => ({
  login: jest.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("이메일 입력창에서 blur 시 검증 에러를 보여준다", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<LoginForm />);

    const emailInput = screen.getByLabelText("이메일");
    await user.click(emailInput);
    await user.tab();

    expect(
      await screen.findByText("이메일을 입력해 주세요."),
    ).toBeInTheDocument();
  });

  it("유효한 값으로 제출하면 login을 호출하고 성공 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    const mockedLogin = jest.mocked(login);
    mockedLogin.mockResolvedValue({ accessToken: "token" });

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("이메일"), "seller@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123!");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalled();
      expect(mockedLogin.mock.calls[0]?.[0]).toEqual({
        email: "seller@example.com",
        password: "password123!",
      });
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("로그인되었습니다.");
    });
  });

  it("로그인 실패 시 에러 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    const mockedLogin = jest.mocked(login);
    mockedLogin.mockRejectedValue(new Error("fail"));

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("이메일"), "seller@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123!");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "로그인 중 문제가 발생했습니다.",
      );
    });
  });
});
