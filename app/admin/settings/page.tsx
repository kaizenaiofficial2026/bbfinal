import { saveSettingsAction } from "../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

type SiteSettings = {
  contactEmail?: string;
  phone?: string;
  address?: string;
  heroCopy?: string;
};

type SettingsPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  await requireAdmin();
  const { saved } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site")
    .maybeSingle();
  const settings = (data?.value ?? {}) as SiteSettings;

  return (
    <div className="admin-stack">
      <div>
        <span className="section-kicker">Settings</span>
        <h1>Site settings</h1>
      </div>
      <form className="admin-card admin-form" action={saveSettingsAction}>
        {saved ? (
          <p className="admin-note-success" role="status">
            Settings saved.
          </p>
        ) : null}
        <label>
          Contact email
          <input
            name="contactEmail"
            type="email"
            defaultValue={settings.contactEmail ?? ""}
          />
          <small className="form-hint">
            Shown on the public contact page and footer.
          </small>
        </label>
        <label>
          Phone
          <input name="phone" defaultValue={settings.phone ?? ""} />
        </label>
        <label>
          Address
          <textarea name="address" defaultValue={settings.address ?? ""} />
        </label>
        <label>
          Hero copy
          <textarea name="heroCopy" defaultValue={settings.heroCopy ?? ""} />
          <small className="form-hint">
            Optional headline used in hero sections.
          </small>
        </label>
        <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
      </form>
    </div>
  );
}
