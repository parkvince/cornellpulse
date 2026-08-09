export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1"

export type ApiErrorKind =
  | "offline"
  | "timeout"
  | "unauthorized"
  | "rate_limited"
  | "maintenance"
  | "duplicate"
  | "invalid_response"
  | "server"

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly retryAfterSeconds?: number

  constructor(message: string, kind: ApiErrorKind, status?: number, retryAfterSeconds?: number) {
    super(message)
    this.name = "ApiError"
    this.kind = kind
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

interface ErrorPayload { detail?: string }
type JsonValidator<T> = (value: unknown) => value is T

export interface ApiRequestOptions<T> extends Omit<RequestInit, "body"> {
  body?: unknown
  apiUrl?: string
  fetchImplementation?: typeof fetch
  timeoutMs?: number
  retries?: number
  idempotencyKey?: string
  validate?: JsonValidator<T>
}

const inFlightMutations = new Map<string, Promise<unknown>>()

function safeDetail(value: unknown, fallback: string): string {
  if (!value || typeof value !== "object") return fallback
  const detail = (value as ErrorPayload).detail
  return typeof detail === "string" && detail.length <= 240 ? detail : fallback
}

function classifyFailure(status: number, detail: string, retryAfter: string | null): ApiError {
  if (status === 401 || status === 403) return new ApiError("Your session is missing or has expired.", "unauthorized", status)
  if (status === 409) return new ApiError(detail, "duplicate", status)
  if (status === 429) {
    const parsed = Number.parseInt(retryAfter || "", 10)
    return new ApiError(detail, "rate_limited", status, Number.isFinite(parsed) ? parsed : undefined)
  }
  if (status === 502 || status === 503 || status === 504) return new ApiError(detail, "maintenance", status)
  return new ApiError(detail, "server", status)
}

function canRetry(method: string, attempt: number, retries: number, status?: number): boolean {
  if (!(["GET", "HEAD"] as string[]).includes(method) || attempt >= retries) return false
  return status === undefined || [502, 503, 504].includes(status)
}

const delay = (milliseconds: number) => new Promise(resolve => globalThis.setTimeout(resolve, milliseconds))

async function executeJson<T>(path: string, options: ApiRequestOptions<T>): Promise<T> {
  const {
    apiUrl = API_URL,
    fetchImplementation = fetch,
    timeoutMs = 8_000,
    retries,
    idempotencyKey,
    validate,
    headers,
    body,
    ...requestInit
  } = options
  const method = (requestInit.method || "GET").toUpperCase()
  const retryLimit = retries ?? (method === "GET" || method === "HEAD" ? 2 : 0)

  for (let attempt = 0; ; attempt += 1) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new ApiError("You are offline. Reconnect and try again.", "offline")
    }

    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    const abortFromCaller = () => controller.abort()
    options.signal?.addEventListener("abort", abortFromCaller, { once: true })
    let response: Response
    try {
      response = await fetchImplementation(`${apiUrl}${path}`, {
        ...requestInit,
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch {
      const timedOut = controller.signal.aborted && !options.signal?.aborted
      if (canRetry(method, attempt, retryLimit)) {
        await delay(150 * (attempt + 1))
        continue
      }
      throw new ApiError(
        timedOut ? "The server took too long to respond. Try again." : "Unable to reach the CornellPulse server. Check your connection and try again.",
        timedOut ? "timeout" : "offline",
      )
    } finally {
      globalThis.clearTimeout(timeout)
      options.signal?.removeEventListener("abort", abortFromCaller)
    }

    let payload: unknown = undefined
    if (response.status !== 204) {
      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        try {
          payload = await response.json()
        } catch {
          if (response.ok) throw new ApiError("The server returned an unreadable response.", "invalid_response", response.status)
        }
      } else if (response.ok) {
        throw new ApiError("The server returned an unexpected response format.", "invalid_response", response.status)
      }
    }

    if (!response.ok) {
      if (canRetry(method, attempt, retryLimit, response.status)) {
        await delay(150 * (attempt + 1))
        continue
      }
      throw classifyFailure(response.status, safeDetail(payload, "The server could not complete this request."), response.headers.get("retry-after"))
    }
    if (validate && !validate(payload)) throw new ApiError("The server returned data in an unexpected format.", "invalid_response", response.status)
    return payload as T
  }
}

export function requestJson<T>(path: string, options: ApiRequestOptions<T> = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase()
  const mutationKey = method !== "GET" && method !== "HEAD" && options.idempotencyKey
    ? `${method}:${options.apiUrl || API_URL}:${path}:${options.idempotencyKey}`
    : ""
  if (mutationKey && inFlightMutations.has(mutationKey)) return inFlightMutations.get(mutationKey) as Promise<T>
  const request = executeJson<T>(path, options)
  if (mutationKey) {
    inFlightMutations.set(mutationKey, request)
    void request.finally(() => inFlightMutations.delete(mutationKey)).catch(() => undefined)
  }
  return request
}

export interface AggregateContribution {
  event: "checkin_completed"
  consent_granted: true
}

interface AggregateContributionResponse { aggregate_updated: true }

function isAggregateResponse(value: unknown): value is AggregateContributionResponse {
  return !!value && typeof value === "object" && (value as AggregateContributionResponse).aggregate_updated === true
}

export function submitAggregateContribution(
  data: AggregateContribution,
  fetchImplementation: typeof fetch = fetch,
  apiUrl = API_URL,
  contributionId: string = crypto.randomUUID(),
) {
  return requestJson<AggregateContributionResponse>("/checkin/aggregate", {
    method: "POST",
    body: data,
    apiUrl,
    fetchImplementation,
    idempotencyKey: contributionId,
    validate: isAggregateResponse,
  })
}
