"use client";

import { useState } from "react";
import type { TourPackage } from "@/lib/data/types";
import { savePackageAction } from "../actions";
import { DirtySubmitButton } from "@/app/admin/_components/DirtySubmitButton";
import { AdminSelect } from "@/app/admin/_components/AdminSelect";
import { MediaUploadField } from "@/app/admin/_components/MediaUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PackageFormProps = {
  tourPackage?: TourPackage | null;
};

export default function PackageForm({ tourPackage }: PackageFormProps) {
  // Block Save while an image is still uploading to storage.
  const [uploading, setUploading] = useState(0);
  const onBusyChange = (busy: boolean) =>
    setUploading((count) => Math.max(0, count + (busy ? 1 : -1)));
  const itinerary =
    tourPackage?.itinerary
      .map((item) => `${item.day} | ${item.title} | ${item.description}`)
      .join("\n") ?? "";

  return (
    <form className="admin-form" action={savePackageAction}>
      <input type="hidden" name="id" value={tourPackage?.id ?? ""} />

      <fieldset className="admin-fieldset">
        <legend>Content</legend>
        <div className="admin-grid-2">
          <Label variant="bare">
            Slug
            <Input
              variant="bare"
              name="slug"
              defaultValue={tourPackage?.slug}
              pattern="[a-z0-9\-]+"
              required
            />
            <small className="form-hint">Lowercase, hyphen-separated.</small>
          </Label>
          <Label variant="bare">
            Duration
            <Input variant="bare" name="duration" defaultValue={tourPackage?.duration} required />
          </Label>
        </div>
        <Label variant="bare">
          Title <Input variant="bare" name="title" defaultValue={tourPackage?.title} required />
        </Label>
        <div className="admin-grid-2">
          <Label variant="bare">
            Tier <Input variant="bare" name="tier" defaultValue={tourPackage?.tier} required />
          </Label>
          <Label variant="bare">
            Hotels
            <Input variant="bare" name="hotels" defaultValue={tourPackage?.hotels} required />
          </Label>
        </div>
        <Label variant="bare">
          Destinations
          <Input
            variant="bare"
            name="destinations"
            defaultValue={tourPackage?.destinations}
            required
          />
        </Label>
        <Label variant="bare">
          Summary
          <Textarea variant="bare" name="summary" defaultValue={tourPackage?.summary} required />
        </Label>
        <Label variant="bare">
          Inclusions
          <Textarea
            variant="bare"
            name="inclusions"
            defaultValue={tourPackage?.inclusions.join("\n")}
            required
          />
          <small className="form-hint">One inclusion per line.</small>
        </Label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Itinerary</legend>
        <Label variant="bare">
          Day-by-day
          <Textarea variant="bare" name="itinerary" defaultValue={itinerary} required rows={8} />
          <small className="form-hint">
            One day per line as <code>Day | Title | Description</code> — e.g.{" "}
            <code>Day 1 | Arrival in Colombo | Airport transfer & welcome dinner</code>
          </small>
        </Label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Pricing</legend>
        <div className="admin-grid-2">
          <Label variant="bare">
            Price amount
            <Input
              variant="bare"
              name="priceAmount"
              type="number"
              step="0.01"
              defaultValue={tourPackage?.priceAmount ?? ""}
            />
          </Label>
          <Label variant="bare">
            Deposit amount
            <Input
              variant="bare"
              name="depositAmount"
              type="number"
              step="0.01"
              defaultValue={tourPackage?.depositAmount ?? ""}
            />
          </Label>
        </div>
        <div className="admin-grid-2">
          <Label variant="bare">
            Currency
            <Input
              variant="bare"
              name="currency"
              maxLength={3}
              defaultValue={tourPackage?.currency ?? "USD"}
            />
          </Label>
          <Label variant="bare">
            Sort order
            <Input
              variant="bare"
              name="sortOrder"
              type="number"
              defaultValue={tourPackage?.sortOrder ?? 0}
            />
          </Label>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Media</legend>
        <MediaUploadField
          label="Card image"
          urlName="image"
          prefix="packages"
          defaultUrl={tourPackage?.image}
          onBusyChange={onBusyChange}
          hint="The thumbnail on the tours list."
        />
        <MediaUploadField
          label="Hero image"
          urlName="heroImage"
          prefix="packages"
          defaultUrl={tourPackage?.heroImage}
          onBusyChange={onBusyChange}
          hint="The banner on the booking page. JPEG, PNG, WEBP or AVIF, up to 8 MB each. Both images can be changed in one save."
        />
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Publishing</legend>
        <Label variant="bare">
          Status
          <AdminSelect
            name="status"
            defaultValue={tourPackage?.status ?? "draft"}
            ariaLabel="Status"
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
        </Label>
      </fieldset>

      <DirtySubmitButton pendingLabel="Saving…" disabled={uploading > 0}>
        {uploading > 0 ? "Uploading image…" : "Save package"}
      </DirtySubmitButton>
    </form>
  );
}
