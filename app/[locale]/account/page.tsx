import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { getCustomerUser } from "@/lib/customer/auth";
import { isExpired } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "My account",
};

type BookingWithPayments = {
  id: string;
  reference: string;
  status: string;
  travel_dates: string;
  tour_packages: { title: string } | null;
  payments: {
    status: string;
    amount: number;
    currency: string;
    pay_token: string;
    pay_token_expires_at: string;
  }[];
};

export default async function AccountPage() {
  const session = await getCustomerUser();

  if (!session) {
    redirect("/login?next=/account");
  }

  const { customer } = session;
  const t = await getTranslations("auth");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, reference, status, travel_dates, tour_packages(title), payments(status, amount, currency, pay_token, pay_token_expires_at)",
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const bookings = (data ?? []) as unknown as BookingWithPayments[];

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("greeting", { name: customer.full_name })}
          label={t("accountLabel")}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={
            customer.verified
              ? t("verifiedSummary")
              : t("unverifiedSummary")
          }
        />
        <section className="section section-paper">
          <div className="container admin-stack">
            <article className="booking-summary-card">
              <span className="booking-form-label">{t("accountStatus")}</span>
              <div className="booking-total-row">
                <span>{t("status")}</span>
                <strong>{customer.verified ? t("verified") : t("awaiting")}</strong>
              </div>
              {customer.verified ? (
                <Link className="btn btn-primary" href="/tours">{t("browseJourneys")}</Link>
              ) : (
                <p className="form-note">{t("approvalNote")}</p>
              )}
            </article>

            <article className="booking-summary-card">
              <span className="booking-form-label">{t("yourBookings")}</span>
              {bookings.length === 0 ? (
                <p className="form-note">{t("noBookings")}</p>
              ) : (
                bookings.map((booking) => {
                  const payment = booking.payments?.[0];
                  const payable =
                    payment &&
                    payment.status !== "captured" &&
                    !isExpired(payment.pay_token_expires_at);

                  return (
                    <div className="booking-total-row" key={booking.id}>
                      <span>
                        {booking.tour_packages?.title ?? t("journey")} · {booking.reference}
                        <br />
                        <small>{booking.travel_dates}</small>
                      </span>
                      <span>
                        <strong>{booking.status}</strong>
                        {payable ? (
                          <>
                            {" "}
                            <Link href={`/pay/${payment.pay_token}`}>{t("continuePayment")}</Link>
                          </>
                        ) : null}
                      </span>
                    </div>
                  );
                })
              )}
            </article>

            <form action={logoutAction}>
              <button className="btn btn-secondary" type="submit">{t("signOut")}</button>
            </form>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
