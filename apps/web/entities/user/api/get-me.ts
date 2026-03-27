import { request } from "@/shared/api";
import type { User } from "../model";

export function getMe() {
  return request<User>("/users/me");
}
