function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true"
}

// These code-reviewed release gates stay false until the corresponding signed
// approval packets and production evidence exist. Environment variables alone
// cannot publish safety-sensitive surfaces.
export const localReleaseApprovals = Object.freeze({
  peerConnect: false,
  supporterSignup: false,
  publicAdmin: false,
})

export const featureFlags = Object.freeze({
  // Keep the navigation entry visible so people can find the feature and see
  // its truthful safety-review status. This does not enable Peer Connect.
  peerNavigation: true,
  peerConnect: enabled(import.meta.env.VITE_FEATURE_PEER_CONNECT) && localReleaseApprovals.peerConnect,
  supporterSignup: enabled(import.meta.env.VITE_FEATURE_SUPPORTER_SIGNUP) && localReleaseApprovals.supporterSignup,
  publicAdmin: enabled(import.meta.env.VITE_FEATURE_PUBLIC_ADMIN) && localReleaseApprovals.publicAdmin,
})
