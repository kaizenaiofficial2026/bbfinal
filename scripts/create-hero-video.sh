#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RAW_DIR="$ROOT_DIR/public/assets/rawvids"
TMP_DIR="$RAW_DIR/tmp-hero-clips"
OUTPUT="$ROOT_DIR/public/assets/hero-bg.mp4"
CONCAT_LIST="$TMP_DIR/concat-list.txt"

VIDEOS=(
  "vid1.mp4"
  "vid2.mp4"
  "vid3.mp4"
  "vid4.mp4"
  "vid5.mp4"
  "vid 6.mp4"
  "vid7.mp4"
  "vid8.mp4"
  "vid9.mp4"
  "vid10.mp4"
)

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: FFmpeg is required but was not found in PATH." >&2
  exit 1
fi

if [[ "$TMP_DIR" != "$RAW_DIR/tmp-hero-clips" ]]; then
  echo "Error: refusing to recreate unexpected temp directory: $TMP_DIR" >&2
  exit 1
fi

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
: > "$CONCAT_LIST"

clip_index=1
for video in "${VIDEOS[@]}"; do
  input="$RAW_DIR/$video"
  if [[ ! -f "$input" ]]; then
    echo "Error: missing source video: $input" >&2
    exit 1
  fi

  clip_file="$TMP_DIR/clip-$(printf "%02d" "$clip_index").mp4"

  echo "Creating clip $clip_index from $video"
  ffmpeg -hide_banner -loglevel error -y \
    -i "$input" \
    -t 2 \
    -an \
    -vf "trim=start=0:duration=2,setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=60,tpad=stop_mode=clone:stop_duration=2,trim=start=0:duration=2,setpts=PTS-STARTPTS,setsar=1,format=yuv420p" \
    -c:v libx264 \
    -preset veryfast \
    -crf 20 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    "$clip_file"

  printf "file '%s'\n" "$clip_file" >> "$CONCAT_LIST"
  clip_index=$((clip_index + 1))
done

echo "Stitching hero video"
ffmpeg -hide_banner -loglevel error -y \
  -f concat \
  -safe 0 \
  -i "$CONCAT_LIST" \
  -an \
  -vf "fps=60,format=yuv420p" \
  -c:v libx264 \
  -preset medium \
  -crf 20 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT"

echo "Created $OUTPUT"
