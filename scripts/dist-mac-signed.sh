#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.mac-signing"

if [[ -f "$ENV_FILE" ]]; then
  # Load local signing variables for this repo.
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

required_vars=(
  "CSC_NAME"
  "APPLE_ID"
  "APPLE_APP_SPECIFIC_PASSWORD"
  "APPLE_TEAM_ID"
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ "${#missing_vars[@]}" -gt 0 ]]; then
  echo "Missing required mac signing variables:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  echo
  echo "Add them to $ENV_FILE or export them in your shell."
  echo "See .env.mac-signing.example for expected format."
  exit 1
fi

# electron-builder expects the subject without the "Developer ID Application:" prefix.
if [[ "${CSC_NAME}" == Developer\ ID\ Application:* ]]; then
  CSC_NAME="${CSC_NAME#Developer ID Application: }"
  export CSC_NAME
fi

if ! security find-identity -v -p codesigning | grep -Fq "Developer ID Application: $CSC_NAME"; then
  echo "No matching Developer ID Application certificate found for CSC_NAME=\"$CSC_NAME\"."
  echo "Install/import the certificate in Keychain Access, then retry."
  exit 1
fi

echo "Building signed macOS artifacts with electron-builder..."
npm run build
npx electron-builder --mac -c.mac.notarize.teamId="$APPLE_TEAM_ID"
