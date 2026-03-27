import "@testing-library/jest-dom";

jest.mock("next/link", () => {
  const React = require("react");

  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
    }) => React.createElement("a", { href, ...props }, children),
  };
});
