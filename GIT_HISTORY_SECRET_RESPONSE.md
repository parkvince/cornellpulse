# Git history credential incident response

Status: **BLOCKED — provider rotation and repository-history rewrite are not authorized or evidenced**
Scan date: **2026-08-10**
Scanner behavior: commit IDs, refs, and paths only; matched values are never printed
Exact code version reviewed: **`72ef3c4ad7788ad6d89b640b097eec90c1364215`**

The project-specific structural scanner found the retired browser-side administrator credential in **18 reachable commit snapshots**, all at `frontend/src/pages/AdminPage.tsx`. Every finding is reachable from `refs/heads/main`, `refs/remotes/origin/main`, and `refs/remotes/origin/HEAD`. The current tracked/untracked tree, examples, local log-like files, native generated web assets, and production bundle are clean under the current scanner.

## Verified repository and remote inventory

Read-only checks on 2026-08-10 established the following bounded facts:

- The public GitHub repository is `parkvince/cornellpulse`; its only visible branch is unprotected `main` at `72ef3c4ad7788ad6d89b640b097eec90c1364215`.
- The repository currently exposes no visible tags, releases, forks, Actions workflow runs, Actions artifacts, deployments, or Actions caches through the queried GitHub APIs.
- The local clone also has `refs/remotes/origin/main`, `refs/remotes/origin/HEAD`, and a Codex audit-capture ref. A rewrite inventory must include every local and remote ref rather than assuming branch-only cleanup is sufficient.
- These GitHub observations do **not** prove that private forks, developer clones, mirrors, hosting-provider caches, CI systems, backups, copied bundles, screenshots, shell histories, issue content, or credential-provider logs are clean. Owners of those systems must inventory them.
- The credential's provider, present validity, rotation status, and historical-use logs cannot be established from this repository. Until the credential owner supplies revocation/rotation evidence and a security owner reviews provider logs, containment remains unproven.

| Commit snapshot | Path | Reachable refs |
| --- | --- | --- |
| `0f41e6bbfdc46fe4dfa086ae62c2532314ea1e9e` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `1de3175cad3e395e587973e7906d7254ef248158` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `234e714d930ac8cb3f08ecb37b2fc911e3726928` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `2466e2842983d481e40075749da9ca28b0ffccc8` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `2d22554d3ba044512b17ab8932a45f018abbe138` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `53bb54fe4da8de81d7d918d136a478141d8fca2e` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `5d0ce47201c202e300b654184413394a9601cd3a` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `5d4c11a4033e13452b65df842b17a4fa52def1f2` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `7c71cf4de9cec40ecbe67612eb6525e6ae94d371` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `9641e4f6c418d22afd10281449d80cae82bd939e` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `97c5ec0099abc76553a9ff7b86f1b5292359ff97` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `b96404f25294174bcac0ea2a3874944afa138959` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `cb114bc5b1ddf93ef3921d1d98cfb0fec6681e1a` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `dd6c2c3c0b26044feb040145729e801f537dd9f4` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `e12b02ab6f57b2f6ad4d003d532f13ec4af10ceb` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `fcfe8a9a7dcd7042a4e23dbb9e038fbb0a1f8dfc` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `fed23ef8c1476af20737dad9946e3b0fd06e5579` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |
| `ff8b45391098f814382a15cedf83f58cfb7be653` | `frontend/src/pages/AdminPage.tsx` | local main; origin main/HEAD |

## Approval-gated containment and rewrite plan

No command in this section is authorization to execute it. Rotation, history rewriting, force-pushing, remote cleanup, and collaborator contact require the user's explicit approval and the named owners.

1. **Freeze and ownership — repository owner and security owner.** Declare the incident window, suspend history-changing merges, identify the credential/provider owner, list every affected repository/ref/provider/deployment/backup, choose a maintenance window, and record decision and rollback owners.
2. **Revoke or rotate first — credential owner.** Revoke the exposed credential at every accepting provider before rewriting Git, invalidate derived sessions/tokens as appropriate, and retain only provider-generated evidence IDs and UTC timestamps. The value must never enter tickets, chat, commands, committed files, evidence, or terminal output. The security owner reviews provider audit logs for unexpected use and documents the incident disposition.
3. **Create a protected recovery mirror — repository owner.** Make a fresh mirror clone in a restricted, encrypted location; fetch every branch, tag, notes ref, and relevant pull-request ref; record pre-rewrite ref SHAs and a checksum-protected backup. Keep one access-controlled offline recovery copy until the rewrite is independently accepted. A rollback restores only this protected mirror if the rewrite damages unrelated history; it does not reactivate the revoked credential or republish the tainted origin.
4. **Prepare the replacement safely — security owner.** Create an ignored, access-restricted replacement-expression file outside the mirror. Do not pass the retired value as a command-line argument or store it in shell history, CI variables used for logging, or documentation. Securely remove the local replacement file after validation under the organization's media-handling policy.
5. **Rewrite in the isolated mirror — repository owner.** Use a current `git-filter-repo` release with `--sensitive-data-removal` and the protected `--replace-text` file. Review `.git/filter-repo/changed-refs`, first-changed commits, pull-request refs, notes, tags, and any orphaned LFS objects. Do not mix objects from the old clone into the cleaned mirror.
6. **Validate before publication — independent security reviewer.** Run the redacting history scanner across every rewritten ref; scan the checked-out tree, examples, generated native web assets, and fresh production bundles; compare the complete before/after ref map; run the full test/build suite; and sign the scoped evidence. Any unexplained ref, build change, or secret finding stops publication.
7. **Publish only with explicit user approval — repository owner.** During the approved window, temporarily adjust branch protection only if required and authorized, force-push only the reviewed branches/tags/refs from the clean mirror, immediately restore protection, and record before/after SHAs. Do not execute a mirror push merely because this plan exists.
8. **Clean residual copies — repository/platform owners.** Ask GitHub Support to remove affected pull-request refs/cached views and run server garbage collection when applicable. Delete or replace affected releases, Actions artifacts/caches, CI logs, deployment artifacts, hosting caches, and backups under their retention policies. Fork, mirror, and clone owners must re-clone or rebase onto the cleaned history and must not merge old branches back, which would reintroduce the objects.
9. **Close and monitor — security and release owners.** Re-run provider log review, repository/ref scans, bundle scans, and deployment scans; confirm collaborators acknowledge re-clone instructions; attach non-secret evidence; monitor for recontamination; and close only after the credential remains revoked and all in-scope copies are accounted for.

GitHub's official procedure emphasizes that repository rewriting cannot remove other copies by itself and requires collaborator/fork coordination and, for cached views or pull-request refs, GitHub Support. The exact commands must be generated and peer-reviewed during the approved change window for the then-current refs; this document intentionally does not embed the retired value.

No rotation, provider audit, history rewrite, force-push, cache purge, fork cleanup, collaborator contact, or re-clone was performed in this task. Those actions remain **BLOCKED pending explicit user authorization, credential/provider access, and named owners**.
