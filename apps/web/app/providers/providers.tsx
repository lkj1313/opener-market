"use client";

import { Toaster } from "sonner";
import { ReactQueryProvider } from "./query-client-provider";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <ReactQueryProvider>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          className: "font-sans",
        }}
      />
    </ReactQueryProvider>
  );
}
