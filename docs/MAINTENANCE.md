# Maintenance Guide (Base-Login & cloned apps like Base CRM)

This document explains the lightweight workflow to keep _shared_ auth/lib/model code in sync between Base-Login and any apps cloned from it (e.g., Base CRM).

---

## 1) Check what changed in shared paths

Use the PowerShell helper we ship with the repo:

```powershell
# From repo root
.\tools\diff-shared.ps1

# Compare against a specific upstream ref (e.g., the template repo):
.\tools\diff-shared.ps1 -BaseRef upstream/main

# Or against the baseline you cloned from:
.\tools\diff-shared.ps1 -BaseRef upstream/v1.02

Shared paths scanned:
src/app/api/auth
src/lib
src/models
packages/auth

2) Moving a change across repos (simple options)
Option A — Cherry-pick a commit

Identify the commit SHA (use git log --oneline -- <shared paths>).

In the destination repo:

git fetch <source-remote>
git checkout -b chore/backport-shared-fix
git cherry-pick <sha>
npm run build
npm run test
git push -u origin chore/backport-shared-fix


Open a PR and merge.

Option B — Make & apply a patch (works even without direct remotes)

In the source repo:

git format-patch -1 <sha> -o .\patches\
# send the .patch file to the other repo (email/commit/any channel)


In the destination repo:

git checkout -b chore/apply-shared-patch
git am .\patches\*.patch
npm run build
npm run test
git push -u origin chore/apply-shared-patch

3) Coding standard (to avoid lint/type issues)

No any in catch blocks. Use:

catch (err: unknown) {
  if (err instanceof Error) {
    // handle err.message, etc.
  } else {
    // handle non-Error thrown values safely
  }
}


Keep shared logic single-sourced. If a change affects multiple apps, prefer updating the same file structure in each repo.

Conventional commits & labels: feat(auth):, fix(auth):, docs:, etc.

4) Versioning & tagging

Tag Base-Login releases that you intend to clone from (e.g., v1.02).

When you clone to a new app:

Add the template repo as upstream.

Record the starting tag in that app’s README or docs.

For future: we may promote shared code to a package (@onevision/base-login-auth) to make updates a version bump.

5) Quick command cheatsheet
# Show shared diffs
.\tools\diff-shared.ps1

# Show shared diffs vs upstream main
.\tools\diff-shared.ps1 -BaseRef upstream/main

# List commits touching shared code
git log --oneline -- src/app/api/auth src/lib src/models packages/auth

# Create a patch from a single commit
git format-patch -1 <sha> -o .\patches\

# Apply patch
git am .\patches\*.patch

# Cherry-pick from another remote
git fetch upstream
git cherry-pick <sha>
```
