#!/bin/sh
# Token priority (highest to lowest):
#   1. GITHUB_TOKEN already set in environment (GitLab CI, GitHub Actions, Gitea Actions)
#   2. Docker secrets file at /run/secrets/github_token_password (local docker-compose)
#   3. No token — build continues unauthenticated (GitHub API rate-limited to 60 req/hr)
#
# CI/CD setup:
#   GitLab CI  → Settings › CI/CD › Variables › add GITHUB_TOKEN (masked, protected)
#   GitHub Actions → Settings › Secrets › add GH_TOKEN; expose as GITHUB_TOKEN in workflow env:
#                    env: { GITHUB_TOKEN: ${{ secrets.GH_TOKEN }} }
#   Gitea Actions  → Settings › Secrets › add GITHUB_TOKEN; expose same way as GitHub Actions

if [ -n "$GITHUB_TOKEN" ]; then
  : # Already exported by CI/CD — use as-is
elif [ -f /run/secrets/github_token_password ]; then
  export GITHUB_TOKEN
  GITHUB_TOKEN=$(cat /run/secrets/github_token_password)
fi

"$@"
exit_code=$?
if [ -n "${HOST_UID}" ] && [ -n "${HOST_GID}" ]; then
  chown -R "${HOST_UID}:${HOST_GID}" /app/dist
fi
exit $exit_code

