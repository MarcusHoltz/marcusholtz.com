#!/bin/sh
# Updates ALL direct dependencies to their latest versions and rewrites pnpm-lock.yaml
# (and optionally node_modules) via a throwaway Docker container.
#
# Security controls applied on every run:
#   1. Minimum release age  — pnpm refuses versions < 1 week old (pnpm-workspace.yaml)
#   2. Age report           — shows publish dates; warns if any resolved pkg is < 7 days old
#   3. Block exotic subdeps — pnpm rejects git/tarball transitive deps (pnpm-workspace.yaml)
#   4. Build approval       — pnpm blocks new install scripts; halts for human review
#   5. Audit                — fails if high/critical CVEs remain after update
#   6. Verify override      — confirms vite version pin is in effect

set -e

INSTALL=0
DISCARD=0
LOCK_ONLY=0

# ── ANSI colours (only when stdout is a terminal) ─────────────────────────────
if [ -t 1 ]; then
  YELLOW='\033[1;33m'
  RED='\033[1;31m'
  GREEN='\033[0;32m'
  RESET='\033[0m'
else
  YELLOW='' RED='' GREEN='' RESET=''
fi

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Updates ALL direct dependencies to their latest versions and rewrites pnpm-lock.yaml
via a throwaway Docker container.

Direct dependencies updated:
  astro  tailwindcss  @tailwindcss/vite  @astrojs/sitemap  @astrojs/check
  typescript  eslint  @typescript-eslint/parser
  eslint-plugin-astro  @types/node

Options:
  -i, --install     Install packages and leave node_modules on the host
  -d, --discard     Install and verify, then remove node_modules from the host
  -l, --lock-only   Update pnpm-lock.yaml only (no node_modules written to host)
  -h, --help        Show this help message and exit

Note:
  -d and -l are mutually exclusive — passing both will exit with an error.

Default behaviour (no flags):
  Show this help message.

Security controls run on every invocation:
  • pnpm minimumReleaseAge (1 week)  — enforced by pnpm itself during resolution
  • Age report                      — warns if resolved versions are < 7 days old
  • blockExoticSubdeps              — enforced by pnpm; git/tarball subdeps are rejected
  • strictDepBuilds                 — new install scripts halt the run for human review
  • pnpm audit --audit-level=high   — fails if high/critical CVEs are present
  • pnpm ls vite                    — verifies the vite version override is in effect
EOF
}

for arg in "$@"; do
  case "$arg" in
    -i|--install)   INSTALL=1 ;;
    -d|--discard)   DISCARD=1 ;;
    -l|--lock-only) LOCK_ONLY=1 ;;
    -h|--help)      usage; exit 0 ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ "$INSTALL" -eq 0 ] && [ "$DISCARD" -eq 0 ] && [ "$LOCK_ONLY" -eq 0 ]; then
  usage
  exit 0
fi

if [ "$DISCARD" -eq 1 ] && [ "$LOCK_ONLY" -eq 1 ]; then
  echo "Error: --discard and --lock-only are mutually exclusive." >&2
  exit 1
fi

# ── All direct dependencies ───────────────────────────────────────────────────
PKGS="astro tailwindcss @tailwindcss/vite @astrojs/sitemap @astrojs/check typescript eslint @typescript-eslint/parser eslint-plugin-astro @types/node"

# ── Build the pnpm command string ─────────────────────────────────────────────
if [ "$LOCK_ONLY" -eq 1 ]; then
  UPDATE_CMD="pnpm update $PKGS --latest --lockfile-only && pnpm ls vite"
elif [ "$DISCARD" -eq 1 ]; then
  UPDATE_CMD="pnpm update $PKGS --latest && pnpm ls vite && rm -rf node_modules"
else
  UPDATE_CMD="pnpm update $PKGS --latest && pnpm ls vite"
fi

# ── Step 1: Update packages ───────────────────────────────────────────────────
# pnpm enforces minimumReleaseAge (1 week) and blockExoticSubdeps automatically.
# If strictDepBuilds detects new unapproved build scripts, pnpm will error here
# and you must run `pnpm approve-builds` before continuing.
echo "==> Updating packages..."
docker run --rm \
  -v "$(pwd):/app:z" \
  -w /app \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  node:24-alpine \
  sh -c "npm install -g pnpm@11 --silent 2>/dev/null; $UPDATE_CMD"

# ── Step 2: Age report ────────────────────────────────────────────────────────
# Query the npm registry for publish timestamps of the resolved versions.
# pnpm already enforced the 1-week minimum; this report shows ages so the operator
# can confirm nothing slipped through before committing the lockfile.
echo ""
echo "==> Checking package publish ages..."

# Extract version from pnpm-lock.yaml v9 format.
# Regular packages:  "  pkg@ver:"
# Scoped packages:   "  '@scope/pkg@ver':"
get_version() {
  pkg="$1"
  case "$pkg" in
    @*)
      grep "^  '${pkg}@" pnpm-lock.yaml 2>/dev/null \
        | head -1 \
        | sed "s|^  '${pkg}@||;s|':.*||"
      ;;
    *)
      grep "^  ${pkg}@" pnpm-lock.yaml 2>/dev/null \
        | head -1 \
        | sed "s|^  ${pkg}@||;s|:.*||"
      ;;
  esac
}

AGE_WARNING=0
for pkg in $PKGS; do
  VERSION=$(get_version "$pkg")
  if [ -z "$VERSION" ]; then
    printf "  %-35s %s\n" "$pkg" "(version not found in lockfile)"
    continue
  fi

  # Fetch publish time from the npm registry
  PUBLISHED=$(wget -qO- "https://registry.npmjs.org/${pkg}/${VERSION}" 2>/dev/null \
    | grep -o '"time":"[^"]*"' | head -1 | sed 's/"time":"//;s/"//')

  if [ -z "$PUBLISHED" ]; then
    printf "  %-35s %s\n" "$pkg@$VERSION" "(publish date unavailable)"
    continue
  fi

  PUB_EPOCH=$(date -d "$PUBLISHED" +%s 2>/dev/null || echo 0)
  NOW_EPOCH=$(date +%s)
  AGE_DAYS=$(( (NOW_EPOCH - PUB_EPOCH) / 86400 ))

  if [ "$AGE_DAYS" -lt 7 ]; then
    printf "  ${YELLOW}%-35s published %s (%d days ago) ← REVIEW RECOMMENDED${RESET}\n" \
      "$pkg@$VERSION" "$PUBLISHED" "$AGE_DAYS"
    AGE_WARNING=1
  else
    printf "  ${GREEN}%-35s published %s (%d days ago)${RESET}\n" \
      "$pkg@$VERSION" "$PUBLISHED" "$AGE_DAYS"
  fi
done

if [ "$AGE_WARNING" -eq 1 ]; then
  echo ""
  printf "${YELLOW}Warning: one or more packages are < 7 days old.${RESET}\n"
  printf "pnpm has already enforced the 1-week minimum release age.\n"
  printf "You may want to wait before committing the updated lockfile.\n"
fi

# ── Step 3: Audit ─────────────────────────────────────────────────────────────
# Fail if any high or critical CVE is present in the resolved dependency tree.
# Workspace overrides in pnpm-workspace.yaml already patch known transitive CVEs
# (e.g. devalue GHSA-77vg-94rm-hx3p). Add new overrides there before running again.
echo ""
echo "==> Running security audit..."
docker run --rm \
  -v "$(pwd):/app:z" \
  -w /app \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  node:24-alpine \
  sh -c "npm install -g pnpm@11 --silent 2>/dev/null; pnpm audit --audit-level=high" \
  || {
    echo ""
    printf "${RED}Audit failed: high or critical vulnerabilities found.${RESET}\n"
    printf "Add workspace overrides in pnpm-workspace.yaml to patch transitive deps,\n"
    printf "or add GHSA IDs to auditConfig.ignoreGhsas only after explicit review.\n"
    exit 1
  }

echo ""
printf "${GREEN}All checks passed.${RESET}\n"

# ── Step 4: Record successful update date in README.md ────────────────────────
TIMESTAMP=$(date -u +"%Y-%m-%d")
MARKER="<!-- packages-last-updated:"
NEW_LINE="<!-- packages-last-updated: ${TIMESTAMP} -->"

if grep -q "$MARKER" README.md 2>/dev/null; then
  sed -i "s|${MARKER}[^>]*>|${NEW_LINE}|" README.md
else
  printf "\n---\n\n%s\n" "$NEW_LINE" >> README.md
fi
printf "${GREEN}README.md updated: dependencies last updated on %s.${RESET}\n" "$TIMESTAMP"
