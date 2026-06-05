const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

export async function submitCheckin(data: object) {
  const res = await fetch(`${BASE_URL}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Checkin failed")
  return res.json()
}