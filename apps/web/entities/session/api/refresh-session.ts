import { clearAccessToken, setAccessToken } from "../model";
import { getApiBaseUrl } from "@/shared/api";

type RefreshSessionResponse = {
  accessToken: string;
};

export async function refreshSession(): Promise<string | null> {
  const response = await fetch(new URL("/auth/refresh", getApiBaseUrl()), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    clearAccessToken();
    return null;
  }

  const data = (await response.json()) as RefreshSessionResponse;

  setAccessToken(data.accessToken);

  return data.accessToken;
}
