import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  anon,
  cleanupTestData,
  createAdmin,
  createCustomer,
  service,
  testEmail,
} from "../support/db";

let alice: Awaited<ReturnType<typeof createCustomer>>;
let bob: Awaited<ReturnType<typeof createCustomer>>;
let secondAdmin: Awaited<ReturnType<typeof createAdmin>>;
let superAdmin: Awaited<ReturnType<typeof createAdmin>>;
let authOnlyCustomer: { id: string; email: string; password: string };
let privilegedRows: { enquiryId: string; destinationId: string };

beforeAll(async () => {
  alice = await createCustomer({ verified: true });
  bob = await createCustomer({ verified: true });
  secondAdmin = await createAdmin("second");
  superAdmin = await createAdmin("super");

  const sb = service();
  const authOnlyEmail = testEmail("direct-signup");
  const authOnlyPassword = "QaCustomer!2026";
  const { data: authOnly, error: authOnlyError } =
    await sb.auth.admin.createUser({
      email: authOnlyEmail,
      password: authOnlyPassword,
      email_confirm: true,
    });
  if (authOnlyError || !authOnly.user) {
    throw new Error(`auth-only customer setup failed: ${authOnlyError?.message}`);
  }
  authOnlyCustomer = {
    id: authOnly.user.id,
    email: authOnlyEmail,
    password: authOnlyPassword,
  };

  const enquiryEmail = testEmail("privileged-enquiry");
  const { data: enquiry, error: enquiryError } = await sb
    .from("enquiries")
    .insert({
      name: "QA privileged enquiry",
      email: enquiryEmail,
      message: "Must be visible only to super admins",
    })
    .select("id")
    .single();
  if (enquiryError || !enquiry) {
    throw new Error(`enquiry setup failed: ${enquiryError?.message}`);
  }

  const slug = `qa-rls-${Date.now()}`;
  const { data: destination, error: destinationError } = await sb
    .from("destinations")
    .insert({
      slug,
      title: "QA restricted draft",
      tagline: "Restricted",
      summary: "Original summary",
      status: "draft",
    })
    .select("id")
    .single();
  if (destinationError || !destination) {
    throw new Error(`destination setup failed: ${destinationError?.message}`);
  }

  privilegedRows = {
    enquiryId: enquiry.id,
    destinationId: destination.id,
  };
});
afterAll(async () => {
  await cleanupTestData();
});

describe("Row-Level Security (integration, test DB)", () => {
  it("anonymous clients cannot read the customers table", async () => {
    const { data } = await anon().from("customers").select("id").limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  it("anonymous clients cannot read reset codes or page views", async () => {
    const codes = await anon().from("password_reset_codes").select("id").limit(1);
    const views = await anon().from("page_views").select("id").limit(1);
    expect(codes.data ?? []).toHaveLength(0);
    expect(views.data ?? []).toHaveLength(0);
  });

  it("anonymous clients cannot insert a customer for someone else", async () => {
    const { error } = await anon()
      .from("customers")
      .insert({ id: alice.id, full_name: "Hijack", email: "hijack@example.com" });
    expect(error).not.toBeNull();
  });

  it("authenticated users cannot self-create an approved customer record", async () => {
    const client = anon();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: authOnlyCustomer.email,
      password: authOnlyCustomer.password,
    });
    expect(signInError).toBeNull();

    const { error: insertError } = await client.from("customers").insert({
      id: authOnlyCustomer.id,
      full_name: "Self Approved",
      email: authOnlyCustomer.email,
      verified: true,
      verified_at: new Date().toISOString(),
    });
    expect(insertError).not.toBeNull();

    const { data: persisted } = await service()
      .from("customers")
      .select("id")
      .eq("id", authOnlyCustomer.id)
      .maybeSingle();
    expect(persisted).toBeNull();
  });

  it("a signed-in customer reads only their own profile", async () => {
    const client = anon();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: alice.email,
      password: alice.password,
    });
    expect(signInError).toBeNull();

    const { data } = await client.from("customers").select("id, email");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(alice.id);
    expect(ids).not.toContain(bob.id);
  });

  it("the service role bypasses RLS and sees all test customers", async () => {
    const { data } = await service()
      .from("customers")
      .select("id")
      .in("id", [alice.id, bob.id]);
    expect((data ?? []).length).toBe(2);
  });

  it("second-level admins cannot read or mutate super-admin resources directly", async () => {
    const client = anon();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: secondAdmin.email,
      password: secondAdmin.password,
    });
    expect(signInError).toBeNull();

    const enquiry = await client
      .from("enquiries")
      .select("id")
      .eq("id", privilegedRows.enquiryId);
    expect(enquiry.error).toBeNull();
    expect(enquiry.data ?? []).toHaveLength(0);

    const destination = await client
      .from("destinations")
      .update({ summary: "Second-level mutation" })
      .eq("id", privilegedRows.destinationId)
      .select("id");
    expect(destination.error).toBeNull();
    expect(destination.data ?? []).toHaveLength(0);

    const profile = await client
      .from("profiles")
      .update({ active: false })
      .eq("id", superAdmin.id)
      .select("id");
    expect(profile.error).toBeNull();
    expect(profile.data ?? []).toHaveLength(0);

    const { data: persistedDestination } = await service()
      .from("destinations")
      .select("summary")
      .eq("id", privilegedRows.destinationId)
      .single();
    const { data: persistedProfile } = await service()
      .from("profiles")
      .select("active")
      .eq("id", superAdmin.id)
      .single();
    expect(persistedDestination?.summary).toBe("Original summary");
    expect(persistedProfile?.active).toBe(true);
  });

  it("super admins retain database access to privileged resources", async () => {
    const client = anon();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: superAdmin.email,
      password: superAdmin.password,
    });
    expect(signInError).toBeNull();

    const { data: enquiry, error: enquiryError } = await client
      .from("enquiries")
      .select("id")
      .eq("id", privilegedRows.enquiryId)
      .single();
    expect(enquiryError).toBeNull();
    expect(enquiry?.id).toBe(privilegedRows.enquiryId);

    const { data: destination, error: destinationError } = await client
      .from("destinations")
      .update({ summary: "Super-admin mutation" })
      .eq("id", privilegedRows.destinationId)
      .select("id, summary")
      .single();
    expect(destinationError).toBeNull();
    expect(destination?.summary).toBe("Super-admin mutation");
  });
});
