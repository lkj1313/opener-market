import { request } from "@/shared/api";

export type SignupPayload = {
  email: string;
  password: string;
  nickname: string;
};

type SignupResponse = {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
};

export async function signup(payload: SignupPayload) {
  return request<SignupResponse>("/auth/signup", {
    method: "POST",
    body: payload,
    requiresAuth: false,
  });
}
