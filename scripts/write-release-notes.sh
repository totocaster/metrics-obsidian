#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <output-file> <version>" >&2
  exit 1
fi

OUTPUT_FILE="$1"
VERSION="$2"

REPOSITORY="${GITHUB_REPOSITORY:-totocaster/metrics-obsidian}"
TAG_NAME="${METRICS_RELEASE_TAG:-${GITHUB_REF_NAME:-${VERSION}}}"
PREVIOUS_TAG="${METRICS_PREVIOUS_TAG:-}"

if [[ -z "${PREVIOUS_TAG}" ]]; then
  PREVIOUS_TAG="$(git describe --tags --match '[0-9]*.[0-9]*.[0-9]*' --abbrev=0 "${TAG_NAME}^" 2>/dev/null || true)"
fi

if [[ -n "${PREVIOUS_TAG}" ]]; then
  RANGE="${PREVIOUS_TAG}..${TAG_NAME}"
  CHANGELOG_URL="https://github.com/${REPOSITORY}/compare/${PREVIOUS_TAG}...${TAG_NAME}"
else
  RANGE="${TAG_NAME}"
  CHANGELOG_URL="https://github.com/${REPOSITORY}/commits/${TAG_NAME}"
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

features="${TMP_DIR}/features.md"
fixes="${TMP_DIR}/fixes.md"
docs="${TMP_DIR}/docs.md"
maintenance="${TMP_DIR}/maintenance.md"
other="${TMP_DIR}/other.md"

touch "${features}" "${fixes}" "${docs}" "${maintenance}" "${other}"

while IFS=$'\t' read -r sha subject; do
  [[ -n "${sha}" && -n "${subject}" ]] || continue

  short_sha="${sha:0:7}"
  entry="- ${subject} ([${short_sha}](https://github.com/${REPOSITORY}/commit/${sha}))"

  case "${subject}" in
    feat:*|feat\(*|feat!:*|feat\(*\)!:*|feature:*|feature\(*)
      printf '%s\n' "${entry}" >> "${features}"
      ;;
    fix:*|fix\(*|fix!:*|fix\(*\)!:*)
      printf '%s\n' "${entry}" >> "${fixes}"
      ;;
    docs:*|docs\(*|docs!:*|docs\(*\)!:*)
      printf '%s\n' "${entry}" >> "${docs}"
      ;;
    chore:*|chore\(*|chore!:*|chore\(*\)!:*|ci:*|ci\(*|ci!:*|ci\(*\)!:*|build:*|build\(*|build!:*|build\(*\)!:*|test:*|test\(*|test!:*|test\(*\)!:*|refactor:*|refactor\(*|refactor!:*|refactor\(*\)!:*|perf:*|perf\(*|perf!:*|perf\(*\)!:*)
      printf '%s\n' "${entry}" >> "${maintenance}"
      ;;
    *)
      printf '%s\n' "${entry}" >> "${other}"
      ;;
  esac
done < <(git log --no-merges --format='%H%x09%s' "${RANGE}")

append_section() {
  local title="$1"
  local file="$2"

  if [[ -s "${file}" ]]; then
    {
      printf '\n### %s\n\n' "${title}"
      cat "${file}"
    } >> "${OUTPUT_FILE}"
  fi
}

cat > "${OUTPUT_FILE}" <<EOF
## Install

Once Metrics is approved in the Obsidian community directory, install it from **Settings > Community plugins**.

For a manual install, download the release assets and place them in:

\`\`\`text
.obsidian/plugins/metrics-lens/
  manifest.json
  main.js
  styles.css
\`\`\`

## Release assets

| Asset | Purpose |
| --- | --- |
| [manifest.json](https://github.com/${REPOSITORY}/releases/download/${TAG_NAME}/manifest.json) | Plugin metadata for Obsidian. |
| [main.js](https://github.com/${REPOSITORY}/releases/download/${TAG_NAME}/main.js) | Bundled plugin code. |
| [styles.css](https://github.com/${REPOSITORY}/releases/download/${TAG_NAME}/styles.css) | Scoped plugin styles. |

## Highlights

Metrics is a file-first Obsidian plugin for viewing and editing canonical \`*.metrics.ndjson\` files. Metrics files remain the source of truth; the plugin provides validation, filtering, grouping, summaries, charts, and record editing without adding a hidden database.

## Changelog
EOF

section_count=0
for file in "${features}" "${fixes}" "${docs}" "${maintenance}" "${other}"; do
  if [[ -s "${file}" ]]; then
    section_count=$((section_count + 1))
  fi
done

append_section "Features" "${features}"
append_section "Fixes" "${fixes}"
append_section "Documentation" "${docs}"
append_section "Maintenance" "${maintenance}"
append_section "Other changes" "${other}"

if [[ "${section_count}" -eq 0 ]]; then
  cat >> "${OUTPUT_FILE}" <<EOF

No commit entries were found for this release range.
EOF
fi

cat >> "${OUTPUT_FILE}" <<EOF

**Full changelog**: ${CHANGELOG_URL}
EOF
