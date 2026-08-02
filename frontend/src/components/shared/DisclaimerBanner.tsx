import { getResource } from "../../resources/registry.ts"

const emergency = getResource("emergency_911")
const publicSafety = getResource("cornell_public_safety")

export default function DisclaimerBanner() {
  return (
    <div style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", color: "#b0b0b0", lineHeight: 1.5, borderTop: "1px solid #f0f0f0", backgroundColor: "#ffffff" }}>
      Not a diagnosis or validated clinical assessment. For an immediate emergency call {emergency.phone}; on the Ithaca campus call {publicSafety.officialName} at {publicSafety.phone}.
    </div>
  )
}
