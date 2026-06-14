import { saveSettingsAction } from "../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SiteSettings = {
  contactEmail?: string;
  phone?: string;
  address?: string;
  heroCopy?: string;
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site")
    .maybeSingle();
  const settings = (data?.value ?? {}) as SiteSettings;

  return (
    <div className="admin-stack">
      <span className="section-kicker">Settings</span>
      <h1>Site settings</h1>
      <form className="admin-card admin-form" action={saveSettingsAction}>
        <label>Contact email <input name="contactEmail" type="email" defaultValue={settings.contactEmail ?? ""} /></label>
        <label>Phone <input name="phone" defaultValue={settings.phone ?? ""} /></label>
        <label>Address <textarea name="address" defaultValue={settings.address ?? ""} /></label>
        <label>Hero copy <textarea name="heroCopy" defaultValue={settings.heroCopy ?? ""} /></label>
        <button className="btn btn-primary" type="submit">Save settings</button>
      </form>
    </div>
  );
}
