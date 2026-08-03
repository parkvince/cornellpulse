export type AdminApiErrorKind = "unauthorized" | "rate_limited" | "network" | "timeout" | "maintenance" | "invalid_response" | "server"

export class AdminApiError extends Error {
  readonly kind: AdminApiErrorKind
  readonly status?: number

  constructor(message: string, kind: AdminApiErrorKind, status?: number) {
    super(message)
    this.name = "AdminApiError"
    this.kind = kind
    this.status = status
  }
}

interface ErrorPayload { detail?: string }

export async function adminRequest(
  apiUrl: string,
  path: string,
  options: RequestInit = {},
  fetchImplementation: typeof fetch = fetch,
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase()
  const retries = method === "GET" || method === "HEAD" ? 2 : 0

  for (let attempt = 0; ; attempt += 1) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new AdminApiError("You are offline. Reconnect before using administrator tools.", "network")
    }
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 8_000)
    let response: Response
    try {
      response = await fetchImplementation(`${apiUrl}${path}`, { ...options, credentials: "include", signal: controller.signal })
    } catch {
      if (attempt < retries) continue
      throw new AdminApiError(
        controller.signal.aborted ? "The administrator request timed out. Try again." : "Unable to reach the CornellPulse server. Check your connection and try again.",
        controller.signal.aborted ? "timeout" : "network",
      )
    } finally {
      globalThis.clearTimeout(timeout)
    }

    if (response.ok) return response
    if ([502, 503, 504].includes(response.status) && attempt < retries) continue

    let detail = "The server could not complete this request."
    try {
      const payload = await response.clone().json() as ErrorPayload
      if (typeof payload.detail === "string" && payload.detail.length <= 240) detail = payload.detail
    } catch {
      // Non-JSON error responses use the safe fallback above.
    }

    if (response.status === 401 || response.status === 403) {
      throw new AdminApiError("Your administrator session has expired. Sign in again.", "unauthorized", response.status)
    }
    if (response.status === 429) throw new AdminApiError(detail, "rate_limited", response.status)
    if ([502, 503, 504].includes(response.status)) throw new AdminApiError("Administrator services are temporarily unavailable.", "maintenance", response.status)
    throw new AdminApiError(detail, "server", response.status)
  }
}

export async function parseAdminJson<T>(response: Response, validate: (value: unknown) => value is T): Promise<T> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new AdminApiError("The server returned an unreadable administrator response.", "invalid_response", response.status)
  }
  if (!validate(payload)) throw new AdminApiError("The server returned administrator data in an unexpected format.", "invalid_response", response.status)
  return payload
}
