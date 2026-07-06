"use client";

import { useCallback, useMemo, useState } from "react";

const MB = 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type FileMeta = { size: number; name: string; type: string };

/**
 * Client-side guard for the admin image-upload forms. Admin content forms can
 * post TWO images (card + hero) in a single Server Action request. When the
 * combined body exceeds Next's `bodySizeLimit`, Next rejects the request at the
 * framework layer BEFORE the action runs — so it can't be caught server-side and
 * used to surface a nice message; it just throws and lands the admin on the error
 * page. This hook tracks the selected files, derives a friendly error if any file
 * is the wrong type / too big or the combined size is too large, and blocks the
 * submit so the over-limit request is never sent. Mirrors the server-side checks
 * in app/admin/actions.ts (8MB per image).
 */
export function useUploadGuard(perFileMb = 8, totalMb = 18) {
  const [files, setFiles] = useState<Record<string, FileMeta>>({});

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      setFiles((current) => ({
        ...current,
        [input.name]: file
          ? { size: file.size, name: file.name, type: file.type }
          : { size: 0, name: "", type: "" },
      }));
    },
    [],
  );

  const error = useMemo<string | null>(() => {
    let total = 0;
    for (const meta of Object.values(files)) {
      if (!meta.size) continue;
      if (meta.type && !ALLOWED_TYPES.includes(meta.type)) {
        return `“${meta.name}” isn’t a supported image. Use JPEG, PNG, WEBP or AVIF.`;
      }
      if (meta.size > perFileMb * MB) {
        return `“${meta.name}” is ${(meta.size / MB).toFixed(1)} MB. Each image must be ${perFileMb} MB or smaller.`;
      }
      total += meta.size;
    }
    if (total > totalMb * MB) {
      return `Those images total ${(total / MB).toFixed(1)} MB. Please keep the combined upload under ${totalMb} MB — try uploading one at a time or using smaller files.`;
    }
    return null;
  }, [files, perFileMb, totalMb]);

  // Belt-and-braces: the submit button is disabled when there's an error, and
  // this also cancels an Enter-key submit.
  const guardSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (error) event.preventDefault();
    },
    [error],
  );

  return { error, onFileChange, guardSubmit };
}
