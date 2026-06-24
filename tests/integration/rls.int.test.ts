import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anon, cleanupTestData, createCustomer, service } from "../support/db";

let alice: Awaited<ReturnType<typeof createCustomer>>;
let bob: Awaited<ReturnType<typeof createCustomer>>;

beforeAll(async () => {
  alice = await createCustomer({ verified: true });
  bob = await createCustomer({ verified: true });
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
    expect(error).not.toBeNull(); // RLS "insert self" check blocks it
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
});
