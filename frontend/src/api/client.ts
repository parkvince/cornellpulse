const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1"

export interface AggregateContribution {
  mood_score: number
  sleep_category: string
  workload_category: string
  college: string
}

export async function submitAggregateContribution(
  data: AggregateContribution,
  fetchImplementation: typeof fetch = fetch,
  apiUrl = BASE_URL,
) {
  const res = await fetchImplementation(`${apiUrl}/checkin/aggregate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Aggregate contribution failed")
  return res.json()
}
