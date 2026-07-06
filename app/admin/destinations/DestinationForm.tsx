"use client";

import { useState } from "react";
import type { Destination } from "@/lib/data/types";
import { saveDestinationAction } from "../actions";
import { DirtySubmitButton } from "@/app/admin/_components/DirtySubmitButton";
import { MediaUploadField } from "@/app/admin/_components/MediaUploadField";

type DestinationFormProps = {
  destination?: Destination | null;
};

export default function DestinationForm({ destination }: DestinationFormProps) {
  // Block Save while an image is still uploading to storage.
  const [uploading, setUploading] = useState(0);
  const onBusyChange = (busy: boolean) =>
    setUploading((count) => Math.max(0, count + (busy ? 1 : -1)));

  return (
    <form className="admin-form" action={saveDestinationAction}>
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
        <MediaUploadField
          label="Card image"
          urlName="cardImage"
          prefix="destinations"
          defaultUrl={destination?.image}
          onBusyChange={onBusyChange}
        />
        <MediaUploadField
          label="Hero image"
          urlName="heroImage"
          prefix="destinations"
          defaultUrl={destination?.heroImage}
          onBusyChange={onBusyChange}
          hint="Uploading replaces the URL. JPEG, PNG, WEBP or AVIF, up to 8 MB each. Both images can be changed in one save."
        />
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

      <DirtySubmitButton pendingLabel="Saving…" disabled={uploading > 0}>
        {uploading > 0 ? "Uploading image…" : "Save destination"}
      </DirtySubmitButton>
    </form>
  );
}
