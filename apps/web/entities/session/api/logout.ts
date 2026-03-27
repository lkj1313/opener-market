import { request } from "@/shared/api";
import { clearAccessToken } from "../model";

export async function logout() {
  try {
    await request("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAccessToken();
  }
}
