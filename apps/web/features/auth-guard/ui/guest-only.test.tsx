import { screen, waitFor } from "@testing-library/react";
import { renderWithQueryClient } from "@/test/test-utils";
import { GuestOnly } from "./guest-only";

const mockReplace = jest.fn();
const mockUseMeQuery = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("@/features/auth-login", () => ({
  useMeQuery: () => mockUseMeQuery(),
}));

describe("GuestOnly", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("로딩 중이면 children 대신 로딩 UI를 보여준다", () => {
    mockUseMeQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithQueryClient(
      <GuestOnly>
        <div>게스트 전용 콘텐츠</div>
      </GuestOnly>,
    );

    expect(screen.queryByText("게스트 전용 콘텐츠")).not.toBeInTheDocument();
  });

  it("비로그인 상태면 children을 렌더링한다", () => {
    mockUseMeQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderWithQueryClient(
      <GuestOnly>
        <div>게스트 전용 콘텐츠</div>
      </GuestOnly>,
    );

    expect(screen.getByText("게스트 전용 콘텐츠")).toBeInTheDocument();
  });

  it("로그인 상태면 홈으로 리다이렉트한다", async () => {
    mockUseMeQuery.mockReturnValue({
      data: { id: "user-1" },
      isLoading: false,
    });

    renderWithQueryClient(
      <GuestOnly>
        <div>게스트 전용 콘텐츠</div>
      </GuestOnly>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    expect(screen.queryByText("게스트 전용 콘텐츠")).not.toBeInTheDocument();
  });
});
