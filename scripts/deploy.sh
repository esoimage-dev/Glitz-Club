#!/usr/bin/env bash
# Builds the static site and publishes it to the gh-pages branch, which GitHub Pages serves.
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE=$(git remote get-url origin)
rm -rf out
NEXT_PUBLIC_BASE_PATH=/Glitz-Club npx next build

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
if git ls-remote --exit-code --heads "$REMOTE" gh-pages >/dev/null 2>&1; then
  git clone --quiet --depth 1 --branch gh-pages "$REMOTE" "$TMP"
else
  git -C "$TMP" init --quiet -b gh-pages
  git -C "$TMP" remote add origin "$REMOTE"
fi
find "$TMP" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R out/. "$TMP"/
touch "$TMP/.nojekyll"

git -C "$TMP" add -A
if git -C "$TMP" diff --cached --quiet; then
  echo "Nessuna modifica da pubblicare."
  exit 0
fi
git -C "$TMP" commit --quiet -m "Publish $(git rev-parse --short HEAD)"
git -C "$TMP" push --quiet origin gh-pages
echo "Pubblicato: https://esoimage-dev.github.io/Glitz-Club/"
