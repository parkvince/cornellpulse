function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true"
}

export const featureFlags = Object.freeze({
  peerConnect: enabled(import.meta.env.VITE_FEATURE_PEER_CONNECT),
  supporterSignup: enabled(import.meta.env.VITE_FEATURE_SUPPORTER_SIGNUP),
  publicAdmin: enabled(import.meta.env.VITE_FEATURE_PUBLIC_ADMIN),
})
