import Image from "next/image";
import type { TourPackage } from "@/lib/data/types";
import { savePackageAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

type PackageFormProps = {
  tourPackage?: TourPackage | null;
};

export default function PackageForm({ tourPackage }: PackageFormProps) {
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
          <label>
            Slug
            <input
              name="slug"
              defaultValue={tourPackage?.slug}
              pattern="[a-z0-9\-]+"
              required
            />
            <small className="form-hint">Lowercase, hyphen-separated.</small>
          </label>
          <label>
            Duration
            <input name="duration" defaultValue={tourPackage?.duration} required />
          </label>
        </div>
        <label>
          Title <input name="title" defaultValue={tourPackage?.title} required />
        </label>
        <div className="admin-grid-2">
          <label>
            Tier <input name="tier" defaultValue={tourPackage?.tier} required />
          </label>
          <label>
            Hotels
            <input name="hotels" defaultValue={tourPackage?.hotels} required />
          </label>
        </div>
        <label>
          Destinations
          <input
            name="destinations"
            defaultValue={tourPackage?.destinations}
            required
          />
        </label>
        <label>
          Summary
          <textarea name="summary" defaultValue={tourPackage?.summary} required />
        </label>
        <label>
          Inclusions
          <textarea
            name="inclusions"
            defaultValue={tourPackage?.inclusions.join("\n")}
            required
          />
          <small className="form-hint">One inclusion per line.</small>
        </label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Itinerary</legend>
        <label>
          Day-by-day
          <textarea name="itinerary" defaultValue={itinerary} required rows={8} />
          <small className="form-hint">
            One day per line as <code>Day | Title | Description</code> — e.g.{" "}
            <code>Day 1 | Arrival in Colombo | Airport transfer & welcome dinner</code>
          </small>
        </label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Pricing</legend>
        <div className="admin-grid-2">
          <label>
            Price amount
            <input
              name="priceAmount"
              type="number"
              step="0.01"
              defaultValue={tourPackage?.priceAmount ?? ""}
            />
          </label>
          <label>
            Deposit amount
            <input
              name="depositAmount"
              type="number"
              step="0.01"
              defaultValue={tourPackage?.depositAmount ?? ""}
            />
          </label>
        </div>
        <div className="admin-grid-2">
          <label>
            Currency
            <input
              name="currency"
              maxLength={3}
              defaultValue={tourPackage?.currency ?? "LKR"}
            />
          </label>
          <label>
            Sort order
            <input
              name="sortOrder"
              type="number"
              defaultValue={tourPackage?.sortOrder ?? 0}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Media</legend>
        {tourPackage?.image ? (
          <Image
            className="admin-thumb"
            src={tourPackage.image}
            alt="Current image"
            width={200}
            height={116}
            unoptimized
          />
        ) : null}
        <label>
          Image URL <input name="image" defaultValue={tourPackage?.image} />
        </label>
        <label>
          Upload image
          <input name="imageFile" type="file" accept="image/*" />
        </label>
        <small className="form-hint">
          Uploading replaces the URL. JPEG, PNG, WEBP or AVIF, up to 5 MB.
        </small>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Publishing</legend>
        <label>
          Status
          <select name="status" defaultValue={tourPackage?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </fieldset>

      <SubmitButton pendingLabel="Saving…">Save package</SubmitButton>
    </form>
  );
}
