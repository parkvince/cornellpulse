export type AdminApiErrorKind = "unauthorized" | "rate_limited" | "network" | "server"

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
  let response: Response
  try {
    response = await fetchImplementation(`${apiUrl}${path}`, { ...options, credentials: "include" })
  } catch {
    throw new AdminApiError("Unable to reach the CornellPulse server. Check your connection and try again.", "network")
  }

  if (response.ok) return response

  let detail = "The server could not complete this request."
  try {
    const payload = await response.clone().json() as ErrorPayload
    if (payload.detail) detail = payload.detail
  } catch {
    // Non-JSON error responses use the safe fallback above.
  }

  if (response.status === 401 || response.status === 403) {
    throw new AdminApiError("Your administrator session has expired. Sign in again.", "unauthorized", response.status)
  }
  if (response.status === 429) {
    throw new AdminApiError(detail, "rate_limited", response.status)
  }
  throw new AdminApiError(detail, "server", response.status)
}
