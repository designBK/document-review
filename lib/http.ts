export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ErrorPayload = {
  error?: string;
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    if (error.message === "Failed to fetch") {
      return "Network error talking to the app server. Hard-refresh http://localhost:3000 and try again.";
    }
    return error.message;
  }
  return fallback;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  let payload: T | ErrorPayload = {};
  try {
    payload = (await response.json()) as T | ErrorPayload;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
