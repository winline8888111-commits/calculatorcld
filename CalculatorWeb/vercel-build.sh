#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

DOTNET_DIR="${HOME}/.dotnet"

if ! command -v dotnet >/dev/null 2>&1 || ! dotnet --list-sdks | grep -q '^10\.'; then
    curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir "${DOTNET_DIR}"
    export PATH="${DOTNET_DIR}:${PATH}"
fi

dotnet publish CalculatorWeb.csproj --configuration Release --output publish -p:PublishTrimmed=false
