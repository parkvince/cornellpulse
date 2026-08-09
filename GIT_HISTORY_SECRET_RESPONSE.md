# Git history credential incident response

Status: **BLOCKED — provider rotation and repository-history rewrite are not authorized or evidenced**
Scan date: **2026-08-09**
Scanner behavior: commit IDs, refs, and paths only; matched values are never printed

The project-specific structural scanner found the retired browser-side administrator credential in **18 reachable commit snapshots**, all at `frontend/src/pages/AdminPage.tsx`. Every finding is reachable from `refs/heads/main`, `refs/remotes/origin/main`, and `refs/remotes/origin/HEAD`. The current tracked/untracked tree, examples, local log-like files, native generated web assets, and production bundle are clean under the current scanner.

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

## Required containment and cleanup

1. **Repository/credential owner:** inventory every provider/environment where this credential or a derived credential could have been accepted, then revoke/rotate it at the provider. Removal from Git is not revocation. Record only provider evidence IDs and times, never the value.
2. **Repository owner:** inventory branches, tags, pull-request refs, forks, releases, caches, build artifacts, CI logs, deployments, collaborators, mirrors, and backups that may retain the affected snapshots.
3. **Security owner:** review provider authentication/audit logs for unexpected historical use and define the incident window and follow-up. The local repository cannot prove this.
4. **Repository owner, only after explicit user approval:** schedule a coordinated history rewrite from a fresh protected mirror. Use `git-filter-repo --sensitive-data-removal` with a local ignored replacement file, re-scan every ref, obtain a second review, then force-push only the approved refs/tags. Do not paste the value into a shell, issue, report, or committed replacement file.
5. **Collaborators/release owners:** discard old clones, remove cached artifacts/releases, re-clone, and verify CI/deploy/backup systems no longer expose old objects. Coordinate fork owners separately; rewriting the origin cannot erase their copies.

No rotation, provider audit, history rewrite, force-push, cache purge, fork cleanup, or collaborator re-clone was performed in this task. Those actions remain **BLOCKED pending owner authorization and production/provider access**.
