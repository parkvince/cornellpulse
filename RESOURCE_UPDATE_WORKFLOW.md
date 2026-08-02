# CornellPulse resource update workflow

`frontend/src/resources/registry.ts` is the only source of truth for resources displayed or recommended by CornellPulse. Screens and recommendation rules must reference stable registry IDs; they must not define their own names, phone numbers, descriptions, hours, or links.

## Add or update a record

1. Open the provider's official website. Prefer the provider's service page over search results, directories, social posts, or copied listings.
2. Verify every material field: official name, description, category, eligibility, cost, phone/text behavior, URL, location, hours, timezone, access instructions, and official source URL.
3. Edit the existing record in `frontend/src/resources/registry.ts`. Keep its stable `id` when a provider renames or changes details so history and analytics do not split.
4. Set `reviewStatus: "verified"`, the actual review date in `verificationDate`, and a non-secret accountable person or team in `verifier` only after all material fields have been checked. Do not use a verification date to mean “file edited.”
5. If verification is incomplete, use `reviewStatus: "needs_review"`, `verificationDate: null`, and explain the pending review through the standard verifier value. The UI will disclose that verification is pending.
6. If a service closes, retain its stable ID with `reviewStatus: "retired"` instead of deleting or reusing the ID. Remove that ID from recommendation and featured lists.
7. Run `npm.cmd run test`, `npm.cmd run build`, and targeted lint. The build runs `scripts/validate-resources.ts` before TypeScript/Vite and fails on malformed records.
8. Have a second reviewer compare the diff with the official source, paying special attention to crisis actions, eligibility, costs, hours, and geographic limitations.

## Review cadence and ownership still required

Before launch, the operator must assign an accountable owner and approve a review cadence. Crisis and emergency records should receive the shortest cadence. Automated link checks can supplement but cannot replace human review because a reachable page may contain changed eligibility, hours, instructions, or contact details.

Never add secrets, private correspondence, personal notes, or unverifiable claims to the registry or verifier field.
