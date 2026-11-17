import { saveAs } from "file-saver";
import { API_URL } from "../config/env";

export enum LocalStorageKeysEnum {
  TOKEN = "accessToken",
}

export const storageToken = () => localStorage.getItem(LocalStorageKeysEnum.TOKEN);

/** Error returned by the StickifyMe API: `message` is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

type Body = object;

function buildInit(method: string, body?: Body): RequestInit {
  const token = storageToken();
  const headers: Record<string, string> = token ? { "x-access-token": token } : {};
  if (body === undefined || body instanceof FormData) {
    return { method, headers, body };
  }
  return {
    method,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const data: { message?: string; details?: unknown } = await response
    .json()
    .catch(() => ({}));
  return new ApiError(
    response.status,
    data.message || `Ошибка запроса (${response.status})`,
    data.details
  );
}

async function request<T>(method: string, url: string, body?: Body): Promise<T> {
  const response = await fetch(API_URL + url, buildInit(method, body));
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

export const get = <T>(url: string) => request<T>("GET", url);
export const post = <T>(url: string, body?: Body) => request<T>("POST", url, body);
export const put = <T>(url: string, body?: Body) => request<T>("PUT", url, body);

/** Downloads a generated PDF; returns the blob for printing or saves it as a file. */
export async function download(
  url: string,
  body: Body,
  print = false
): Promise<Blob | undefined> {
  const response = await fetch(API_URL + url, buildInit("POST", body));
  if (!response.ok) {
    throw await toApiError(response);
  }
  const blob = await response.blob();
  if (print) {
    return blob;
  }
  saveAs(blob, "stickers.pdf");
  return undefined;
}

/**
 * POSTs a request whose response is newline-delimited JSON and calls `onEvent`
 * for every line as soon as it arrives (used for long WB imports with progress).
 */
export async function postNdjson<TEvent>(
  url: string,
  body: Body,
  onEvent: (event: TEvent) => void
): Promise<void> {
  const response = await fetch(API_URL + url, buildInit("POST", body));
  if (!response.ok || !response.body) {
    throw await toApiError(response);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line) as TEvent));
    if (done) {
      break;
    }
  }
  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as TEvent);
  }
}
