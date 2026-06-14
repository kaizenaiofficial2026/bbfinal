import type { TourPackage } from "@/lib/data/types";
import { savePackageAction } from "../actions";

type PackageFormProps = {
  tourPackage?: TourPackage | null;
};

export default function PackageForm({ tourPackage }: PackageFormProps) {
  const itinerary =
    tourPackage?.itinerary
      .map((item) => `${item.day} | ${item.title} | ${item.description}`)
      .join("\n") ?? "";

  return (
    <form className="admin-card admin-form" action={savePackageAction}>
      <input type="hidden" name="id" value={tourPackage?.id ?? ""} />
      <label>Slug <input name="slug" defaultValue={tourPackage?.slug} required /></label>
      <label>Title <input name="title" defaultValue={tourPackage?.title} required /></label>
      <label>Tier <input name="tier" defaultValue={tourPackage?.tier} required /></label>
      <label>Hotels <input name="hotels" defaultValue={tourPackage?.hotels} required /></label>
      <label>Destinations <input name="destinations" defaultValue={tourPackage?.destinations} required /></label>
      <label>Duration <input name="duration" defaultValue={tourPackage?.duration} required /></label>
      <label>Image URL <input name="image" defaultValue={tourPackage?.image} /></label>
      <label>Upload image <input name="imageFile" type="file" accept="image/*" /></label>
      <label>Summary <textarea name="summary" defaultValue={tourPackage?.summary} required /></label>
      <label>Inclusions, one per line <textarea name="inclusions" defaultValue={tourPackage?.inclusions.join("\n")} required /></label>
      <label>Itinerary: Day | Title | Description, one per line <textarea name="itinerary" defaultValue={itinerary} required /></label>
      <label>Price amount <input name="priceAmount" type="number" step="0.01" defaultValue={tourPackage?.priceAmount ?? ""} /></label>
      <label>Deposit amount <input name="depositAmount" type="number" step="0.01" defaultValue={tourPackage?.depositAmount ?? ""} /></label>
      <label>Currency <input name="currency" maxLength={3} defaultValue={tourPackage?.currency ?? "LKR"} /></label>
      <label>Sort order <input name="sortOrder" type="number" defaultValue={tourPackage?.sortOrder ?? 0} /></label>
      <label>Status
        <select name="status" defaultValue={tourPackage?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <button className="btn btn-primary" type="submit">Save package</button>
    </form>
  );
}
