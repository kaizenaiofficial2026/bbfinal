import type { Destination } from "@/lib/data/types";
import { saveDestinationAction } from "../actions";

type DestinationFormProps = {
  destination?: Destination | null;
};

export default function DestinationForm({ destination }: DestinationFormProps) {
  return (
    <form className="admin-card admin-form" action={saveDestinationAction}>
      <input type="hidden" name="id" value={destination?.id ?? ""} />
      <label>Slug <input name="slug" defaultValue={destination?.slug} required /></label>
      <label>Title <input name="title" defaultValue={destination?.title} required /></label>
      <label>Tagline <input name="tagline" defaultValue={destination?.tagline} required /></label>
      <label>Key attraction <input name="keyAttraction" defaultValue={destination?.keyAttraction} required /></label>
      <label>Summary <textarea name="summary" defaultValue={destination?.summary} required /></label>
      <label>Best for <input name="bestFor" defaultValue={destination?.bestFor} required /></label>
      <label>Highlights, one per line <textarea name="highlights" defaultValue={destination?.highlights.join("\n")} required /></label>
      <label>Card image URL <input name="cardImage" defaultValue={destination?.image} /></label>
      <label>Upload card image <input name="cardImageFile" type="file" accept="image/*" /></label>
      <label>Hero image URL <input name="heroImage" defaultValue={destination?.heroImage} /></label>
      <label>Upload hero image <input name="heroImageFile" type="file" accept="image/*" /></label>
      <label>Sort order <input name="sortOrder" type="number" defaultValue={destination?.sortOrder ?? 0} /></label>
      <label>Status
        <select name="status" defaultValue={destination?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <button className="btn btn-primary" type="submit">Save destination</button>
    </form>
  );
}
