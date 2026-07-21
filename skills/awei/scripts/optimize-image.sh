#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: optimize-image.sh INPUT OUTPUT.webp" >&2
  exit 2
fi

input_path=$1
output_path=$2
max_bytes=512000
temp_dir=$(mktemp -d)
resized_png="$temp_dir/resized.png"

cleanup() {
  rm -rf "$temp_dir"
}
trap cleanup EXIT INT TERM

mkdir -p "$(dirname "$output_path")"
sips -Z 1600 "$input_path" --out "$resized_png" >/dev/null

for quality in 84 80 76 72 68 64 60; do
  cwebp -quiet -mt -m 6 -q "$quality" "$resized_png" -o "$output_path"
  file_bytes=$(stat -f '%z' "$output_path")
  if [ "$file_bytes" -le "$max_bytes" ]; then
    exit 0
  fi
done

echo "Warning: output remains larger than 500 KB; simplify or regenerate the image." >&2
exit 1
