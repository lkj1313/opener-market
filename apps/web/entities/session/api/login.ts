import { request } from "@/shared/api";
import { setAccessToken } from "../model";

export type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
};

export async function login(payload: LoginPayload) {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
    requiresAuth: false,
  });

  setAccessToken(data.accessToken);

  return data;
}
