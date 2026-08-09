# Git history credential response

The automated history scanner reports commit IDs and paths only; it never prints matched values. Its patterns cover common private keys and AWS, GitHub, Resend, and OpenAI token formats. A clean result does not replace provider-side secret inventory or rotation.

If a credential is found or was ever shared:

1. Revoke or rotate it at the provider first. Treat removal from Git as cleanup, not revocation.
2. Record the affected credential type, paths, refs, forks, releases, caches, CI logs, and deployment environments without copying the value into an issue or repository file.
3. Make a protected mirror backup and coordinate a maintenance window. History rewriting changes commit IDs for every descendant commit.
4. Install `git-filter-repo` from its official project. In a fresh mirror clone, use a local, ignored replacement file and `git filter-repo --sensitive-data-removal --replace-text <replacement-file>`. Never commit the replacement file or paste the credential into a shell transcript.
5. Re-run `scripts/history-secret-scan.ps1`, inspect all refs/tags, and have a second reviewer confirm the intended scope.
6. Only with explicit repository-owner approval, force-push every rewritten branch and tag using the narrowest commands possible. Do not rewrite or push from this remediation task.
7. Ask collaborators to discard old clones, remove cached artifacts/releases, and re-clone. Confirm CI, hosts, backups, and package registries no longer expose the old value.
8. Monitor the rotated credential's provider audit log for unexpected use.

Rewriting history is intentionally blocked pending explicit user approval.
