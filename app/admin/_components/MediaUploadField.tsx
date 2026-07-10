"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Spinner from "@/components/Spinner";
import { uploadMediaDirect } from "@/lib/admin/upload-media";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MB = 1024 * 1024;
const MAX_MB = 8;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type MediaUploadFieldProps = {
  /** Human label, e.g. "Card image". */
  label: string;
  /** Form field name that carries the resulting URL, e.g. "cardImage" or "image". */
  urlName: string;
  /** Storage folder for the upload. */
  prefix: "destinations" | "packages";
  defaultUrl?: string;
  hint?: string;
  /** Reports whether an upload is in flight so the form can block Save. */
  onBusyChange?: (busy: boolean) => void;
};

/**
 * Image field that uploads DIRECTLY from the browser to Supabase Storage (see
 * uploadMediaDirect) and writes only the resulting URL into the form. Because the
 * bytes never pass through the Server Action, there's no request-body size limit
 * to hit — both the card and hero image can be attached in one save. The admin
 * can also just paste a URL into the text field.
 */
export function MediaUploadField({
  label,
  urlName,
  prefix,
  defaultUrl = "",
  hint,
  onBusyChange,
}: MediaUploadFieldProps) {
  const urlRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);

  function commitUrl(value: string) {
    const input = urlRef.current;
    if (input) {
      input.value = value;
      // A programmatic value change doesn't fire input events, so dispatch one:
      // the form's dirty-detection (DirtySubmitButton) listens for it, and it
      // keeps the DOM value in sync for FormData on submit.
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setPreview(value);
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileKey((k) => k + 1); // reset the picker; the bytes are never submitted
    if (!file) return;

    setError(null);
    if (file.type && !ALLOWED.includes(file.type)) {
      setStatus("error");
      setError("Unsupported image type. Use JPEG, PNG, WEBP or AVIF.");
      return;
    }
    if (file.size > MAX_MB * MB) {
      setStatus("error");
      setError(
        `That image is ${(file.size / MB).toFixed(1)} MB. The maximum is ${MAX_MB} MB.`,
      );
      return;
    }

    setStatus("uploading");
    onBusyChange?.(true);
    try {
      const url = await uploadMediaDirect(prefix, file);
      commitUrl(url);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      onBusyChange?.(false);
    }
  }

  return (
    <div className="admin-media-field">
      {preview ? (
        <Image
          className="admin-thumb"
          src={preview}
          alt={`${label} preview`}
          width={200}
          height={116}
          unoptimized
        />
      ) : null}
      <Label variant="bare">
        {label} URL
        <Input
          variant="bare"
          ref={urlRef}
          name={urlName}
          defaultValue={defaultUrl}
          onChange={(event) => setPreview(event.target.value)}
        />
      </Label>
      <Label variant="bare">
        Upload {label.toLowerCase()}
        <Input
          variant="bare"
          key={fileKey}
          type="file"
          accept="image/*"
          onChange={onPick}
          disabled={status === "uploading"}
        />
      </Label>
      {status === "uploading" ? (
        <p className="form-hint admin-media-uploading">
          <Spinner /> Uploading…
        </p>
      ) : null}
      {status === "error" && error ? (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      ) : null}
      {hint ? <small className="form-hint">{hint}</small> : null}
    </div>
  );
}
