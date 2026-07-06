"use client";

import Image from "next/image";
import type { Destination } from "@/lib/data/types";
import { saveDestinationAction } from "../actions";
import { DirtySubmitButton } from "@/app/admin/_components/DirtySubmitButton";
import { useUploadGuard } from "@/app/admin/_components/useUploadGuard";

type DestinationFormProps = {
  destination?: Destination | null;
};

export default function DestinationForm({ destination }: DestinationFormProps) {
  const { error, onFileChange, guardSubmit } = useUploadGuard();

  return (
    <form
      className="admin-form"
      action={saveDestinationAction}
      onSubmit={guardSubmit}
    >
      {error ? (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      ) : null}
      <input type="hidden" name="id" value={destination?.id ?? ""} />

      <fieldset className="admin-fieldset">
        <legend>Content</legend>
        <div className="admin-grid-2">
          <label>
            Slug
            <input
              name="slug"
              defaultValue={destination?.slug}
              pattern="[a-z0-9\-]+"
              required
            />
            <small className="form-hint">Lowercase, hyphen-separated.</small>
          </label>
          <label>
            Sort order
            <input
              name="sortOrder"
              type="number"
              defaultValue={destination?.sortOrder ?? 0}
            />
          </label>
        </div>
        <label>
          Title <input name="title" defaultValue={destination?.title} required />
        </label>
        <label>
          Tagline
          <input name="tagline" defaultValue={destination?.tagline} required />
        </label>
        <label>
          Key attraction
          <input
            name="keyAttraction"
            defaultValue={destination?.keyAttraction}
            required
          />
        </label>
        <label>
          Summary
          <textarea name="summary" defaultValue={destination?.summary} required />
        </label>
        <label>
          Best for
          <input name="bestFor" defaultValue={destination?.bestFor} required />
        </label>
        <label>
          Highlights
          <textarea
            name="highlights"
            defaultValue={destination?.highlights.join("\n")}
            required
          />
          <small className="form-hint">One highlight per line.</small>
        </label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Media</legend>
        {destination?.image ? (
          <Image
            className="admin-thumb"
            src={destination.image}
            alt="Current card image"
            width={200}
            height={116}
            unoptimized
          />
        ) : null}
        <label>
          Card image URL
          <input name="cardImage" defaultValue={destination?.image} />
        </label>
        <label>
          Upload card image
          <input
            name="cardImageFile"
            type="file"
            accept="image/*"
            onChange={onFileChange}
          />
        </label>
        {destination?.heroImage ? (
          <Image
            className="admin-thumb"
            src={destination.heroImage}
            alt="Current hero image"
            width={200}
            height={116}
            unoptimized
          />
        ) : null}
        <label>
          Hero image URL
          <input name="heroImage" defaultValue={destination?.heroImage} />
        </label>
        <label>
          Upload hero image
          <input
            name="heroImageFile"
            type="file"
            accept="image/*"
            onChange={onFileChange}
          />
        </label>
        <small className="form-hint">
          Uploading replaces the URL. JPEG, PNG, WEBP or AVIF, up to 8 MB each.
        </small>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Publishing</legend>
        <label>
          Status
          <select name="status" defaultValue={destination?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </fieldset>

      <DirtySubmitButton pendingLabel="Saving…" disabled={!!error}>
        Save destination
      </DirtySubmitButton>
    </form>
  );
}
