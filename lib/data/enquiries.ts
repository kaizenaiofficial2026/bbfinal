import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];

export async function createEnquiry(
  enquiry: Database["public"]["Tables"]["enquiries"]["Insert"],
) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("enquiries")
    .insert(enquiry)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function countRecentEnquiriesByIp(ipHash: string | null) {
  if (!ipHash) {
    return 0;
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function listEnquiries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEnquiry(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
