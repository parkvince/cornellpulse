import { useEffect, useState } from "react"
import { ApiError, requestJson } from "../../api/client"

type ConnectionState = "online" | "offline" | "checking" | "maintenance" | "stale" | "error"

function isReadiness(value: unknown): value is { status: "ready" | "not_ready" } {
  return !!value && typeof value === "object" && ["ready", "not_ready"].includes(String((value as { status?: unknown }).status))
}

export default function ConnectivityBanner() {
  const [state, setState] = useState<ConnectionState>(() => navigator.onLine ? "checking" : "offline")

  useEffect(() => {
    let active = true
    let lastReadyAt = 0
    const controller = new AbortController()

    async function check() {
      if (!navigator.onLine) {
        if (active) setState("offline")
        return
      }
      try {
        const result = await requestJson<{ status: "ready" | "not_ready" }>("/health/ready", {
          timeoutMs: 4_000,
          retries: 1,
          signal: controller.signal,
          validate: isReadiness,
        })
        if (!active) return
        if (result.status === "ready") {
          lastReadyAt = Date.now()
          setState("online")
        } else {
          setState("maintenance")
        }
      } catch (error) {
        if (!active) return
        if (!navigator.onLine || (error instanceof ApiError && error.kind === "offline")) setState("offline")
        else if (error instanceof ApiError && error.kind === "maintenance") setState("maintenance")
        else if (lastReadyAt && Date.now() - lastReadyAt < 5 * 60_000) setState("stale")
        else setState("error")
      }
    }

    const handleOnline = () => { setState("checking"); void check() }
    const handleOffline = () => setState("offline")
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    void check()
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void check() }, 60_000)
    return () => {
      active = false
      controller.abort()
      window.clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (state === "online" || state === "checking") return null
  const message = state === "offline"
    ? "You’re offline. Saved history and the resource directory remain available; live server actions will wait for a connection."
    : state === "maintenance"
      ? "Live CornellPulse services are temporarily unavailable. Local check-ins and saved history still work."
      : state === "stale"
        ? "Live service status could not be refreshed. Previously loaded local information may be stale."
        : "CornellPulse could not confirm server status. Local features remain available; live actions may fail."

  return <div className="connectivity-banner" role="status" aria-live="polite">{message}</div>
}
