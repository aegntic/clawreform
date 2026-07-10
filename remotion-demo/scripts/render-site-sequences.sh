#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_PUBLIC_DIR="${ROOT_DIR}/../site/public/scroll-sequences"

render_sequence() {
  local composition="$1"
  local slug="$2"
  local frame_count="$3"
  local out_dir="${SITE_PUBLIC_DIR}/${slug}"
  local video_path="${out_dir}/${slug}.mp4"

  mkdir -p "${out_dir}"
  rm -f "${video_path}"
  rm -f "${out_dir}"/frame-*.jpg

  echo "Rendering ${composition} -> ${video_path}"
  "${ROOT_DIR}/node_modules/.bin/remotion" render "${composition}" "${video_path}"

  echo "Extracting frames -> ${out_dir}/frame-####.jpg"
  ffmpeg -y -i "${video_path}" -q:v 3 "${out_dir}/frame-%04d.jpg" >/dev/null 2>&1

  cat > "${out_dir}/manifest.json" <<EOF
{
  "composition": "${composition}",
  "slug": "${slug}",
  "frameCount": ${frame_count},
  "width": 960,
  "height": 540,
  "video": "/scroll-sequences/${slug}/${slug}.mp4",
  "pattern": "/scroll-sequences/${slug}/frame-%04d.jpg"
}
EOF
}

render_sequence "SiteFabricSequence" "fabric" 150
render_sequence "SiteMemorySequence" "memory" 120

echo "Scroll sequences ready in ${SITE_PUBLIC_DIR}"
