import { refreshSession } from "@/entities/session/api";
import { clearAccessToken, getAccessToken } from "@/entities/session/model";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue>;

type JsonBody = Record<string, unknown> | unknown[];

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonBody | null;
  query?: QueryParams;
  requiresAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let refreshPromise: Promise<string | null> | null = null;

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function buildUrl(path: string, query?: QueryParams) {
  const url = path.startsWith("http")
    ? new URL(path)
    : new URL(path, getApiBaseUrl());

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function isJsonBody(body: RequestOptions["body"]): body is JsonBody {
  if (body === null || body === undefined) {
    return false;
  }

  if (typeof body !== "object") {
    return false;
  }

  return (
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  );
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return "요청 처리 중 오류가 발생했습니다.";
}

async function getRefreshedAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    query,
    body,
    headers,
    credentials,
    requiresAuth = true,
    ...rest
  } = options;

  const baseHeaders = new Headers(headers);
  let requestBody: BodyInit | null | undefined;

  if (isJsonBody(body)) {
    baseHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  } else {
    requestBody = body;
  }

  if (!baseHeaders.has("Accept")) {
    baseHeaders.set("Accept", "application/json");
  }

  const execute = (accessToken?: string | null) => {
    const requestHeaders = new Headers(baseHeaders);

    if (requiresAuth && accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    return fetch(buildUrl(path, query), {
      ...rest,
      body: requestBody,
      headers: requestHeaders,
      credentials: credentials ?? "include",
    });
  };

  let response = await execute(getAccessToken());

  if (response.status === 401 && requiresAuth) {
    const refreshedAccessToken = await getRefreshedAccessToken();

    if (!refreshedAccessToken) {
      clearAccessToken();
      throw new ApiError("인증이 만료되었습니다.", 401, null);
    }

    response = await execute(refreshedAccessToken);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401 && requiresAuth) {
      clearAccessToken();
    }

    throw new ApiError(getErrorMessage(data), response.status, data);
  }

  return data as T;
}
