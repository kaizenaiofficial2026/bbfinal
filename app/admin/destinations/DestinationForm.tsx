"use client";

import { useState } from "react";
import type { Destination } from "@/lib/data/types";
import { saveDestinationAction } from "../actions";
import { DirtySubmitButton } from "@/app/admin/_components/DirtySubmitButton";
import { AdminSelect } from "@/app/admin/_components/AdminSelect";
import { MediaUploadField } from "@/app/admin/_components/MediaUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
          <Label variant="bare">
            Slug
            <Input
              variant="bare"
              name="slug"
              defaultValue={destination?.slug}
              pattern="[a-z0-9\-]+"
              required
            />
            <small className="form-hint">Lowercase, hyphen-separated.</small>
          </Label>
          <Label variant="bare">
            Sort order
            <Input
              variant="bare"
              name="sortOrder"
              type="number"
              defaultValue={destination?.sortOrder ?? 0}
            />
          </Label>
        </div>
        <Label variant="bare">
          Title <Input variant="bare" name="title" defaultValue={destination?.title} required />
        </Label>
        <Label variant="bare">
          Tagline
          <Input variant="bare" name="tagline" defaultValue={destination?.tagline} required />
        </Label>
        <Label variant="bare">
          Key attraction
          <Input
            variant="bare"
            name="keyAttraction"
            defaultValue={destination?.keyAttraction}
            required
          />
        </Label>
        <Label variant="bare">
          Summary
          <Textarea variant="bare" name="summary" defaultValue={destination?.summary} required />
        </Label>
        <Label variant="bare">
          Best for
          <Input variant="bare" name="bestFor" defaultValue={destination?.bestFor} required />
        </Label>
        <Label variant="bare">
          Highlights
          <Textarea
            variant="bare"
            name="highlights"
            defaultValue={destination?.highlights.join("\n")}
            required
          />
          <small className="form-hint">One highlight per line.</small>
        </Label>
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
        <Label variant="bare">
          Status
          <AdminSelect
            name="status"
            defaultValue={destination?.status ?? "draft"}
            ariaLabel="Status"
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
        </Label>
      </fieldset>

      <DirtySubmitButton pendingLabel="Saving…" disabled={uploading > 0}>
        {uploading > 0 ? "Uploading image…" : "Save destination"}
      </DirtySubmitButton>
    </form>
  );
}
