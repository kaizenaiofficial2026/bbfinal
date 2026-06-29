import "server-only";

import { dbError } from "@/lib/data/errors";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type CustomInquiryRow =
  Database["public"]["Tables"]["custom_inquiries"]["Row"];

export async function createCustomInquiry(
  inquiry: Database["public"]["Tables"]["custom_inquiries"]["Insert"],
) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("custom_inquiries").insert(inquiry);

  if (error) {
    dbError(error);
  }
}

export async function countRecentCustomInquiriesByIp(ipHash: string | null) {
  if (!ipHash) {
    return 0;
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("custom_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    dbError(error);
  }

  return count ?? 0;
}

export async function listCustomInquiries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    dbError(error);
  }

  return data;
}

export async function getCustomInquiry(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    dbError(error);
  }

  return data;
}
