/**
 * SSR/CSR 환경에 따라 API base URL 동적 해석.
 *
 * - 모듈 로드 시점에 평가하지 않음 (Turbopack의 정적 치환 회피).
 * - 각 fetch 호출마다 한 번씩 평가.
 */
function resolveApiBase(): string {
  if (typeof window === "undefined") {
    // SSR — Node fetch는 절대 URL 필요. 운영 EC2에서 backend는 같은 호스트.
    return process.env.API_BASE_INTERNAL || "http://127.0.0.1:8080";
  }
  // 브라우저 — 비어있으면 같은 origin (nginx가 /api 프록시).
  return process.env.NEXT_PUBLIC_API_BASE || "";
}

/** 빌드 타임에 결정되는 값 — 주로 브라우저 컨텍스트에서 imageSrc 등 동기 헬퍼용. */
export const API_BASE = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE
  ? process.env.NEXT_PUBLIC_API_BASE
  : "";

/** 서버 컴포넌트에서 직접 fetch 호출 시 사용. */
export function serverApiBase(): string {
  return process.env.API_BASE_INTERNAL || "http://127.0.0.1:8080";
}

export class ApiError extends Error {
  status: number;
  code?: string;
  validationErrors?: { field: string; message: string }[];

  constructor(status: number, message: string, code?: string, validationErrors?: { field: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.validationErrors = validationErrors;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const init: RequestInit = {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(headers as Record<string, string> | undefined),
    },
    ...rest,
  };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }
  const res = await fetch(`${resolveApiBase()}${path}`, init);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const message = (json && typeof json === "object" && "message" in json && typeof json.message === "string")
      ? json.message
      : `HTTP ${res.status}`;
    const code = (json && typeof json === "object" && "error" in json && typeof json.error === "string")
      ? json.error
      : undefined;
    const validationErrors = (json && typeof json === "object" && "validationErrors" in json && Array.isArray(json.validationErrors))
      ? json.validationErrors as { field: string; message: string }[]
      : undefined;
    throw new ApiError(res.status, message, code, validationErrors);
  }
  return json as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** 서버 컴포넌트에서 호출할 때 클라이언트 쿠키를 백엔드로 전달. */
export async function apiServer<T = unknown>(path: string, cookieHeader: string, options: RequestOptions = {}): Promise<T> {
  return api<T>(path, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      Cookie: cookieHeader,
    },
  });
}
