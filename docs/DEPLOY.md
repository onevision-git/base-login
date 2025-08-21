# Base-Login — Production Release Deployment (Feature > Main > Deploy + Tag)

**Assumes:** Vercel deploys from `origin/main`.  
**Goal:** Deploy to production, then lock the exact code with a `v1.00` tag (and optionally a `release/v1.00` branch).

```powershell
# 0) From repo root
cd C:\Users\MattBrown\Documents\SaaS\Projects\base-login

# ==== 1) Ensure your feature branch is fully pushed ====
git checkout feature/frontend-login-ui
git add -A
git commit -m "chore(release): v1.00"     # skip if nothing to commit
git push origin feature/frontend-login-ui  # push local feature → origin/feature

# ==== 2) Refresh local view of remote branches ====
git fetch origin

# ==== 3) Sync local main with origin/main (avoid merging onto stale main) ====
git checkout main
git pull origin main                      # make local main == origin/main

# ==== 4) Bring FEATURE → local MAIN ====
# Prefer fast-forward for a clean history
git merge --ff-only origin/feature/frontend-login-ui

# If fast-forward not possible, do a merge commit:
# git merge origin/feature/frontend-login-ui
# (Resolve any conflicts → `git add -A` → `git commit`)

# (Optional) Sanity check what will be published
git diff --name-status origin/main..HEAD

# ==== 5) Publish MAIN → GitHub (triggers Vercel production deploy) ====
git push origin main

# ==== 6) Verify the deployment’s commit SHA (optional but recommended) ====
git rev-parse origin/main                 # copy this SHA
# In Vercel > Deployments, confirm a new Production deployment with this exact SHA.

# ==== 7) Tag the exact production commit (LOCK v1.00) ====
git fetch origin
git checkout main
git pull origin main                      # ensure local main is the deployed commit
git tag -a v1.00 -m "Base-Login v1.00"    # create an annotated, immutable tag
git push origin v1.00                     # publish the tag

# ==== 8) (Optional) Create a release branch for future hotfixes ====
git branch -f release/v1.00
git push -u origin release/v1.00
