import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { getCustomerUser } from "@/lib/customer/auth";
import { isExpired } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChangePasswordWizard from "@/components/account/ChangePasswordWizard";
import DeleteAccountButton from "@/components/account/DeleteAccountButton";
import SubmitButton from "@/components/SubmitButton";
import { deleteAccountAction, logoutAction } from "./actions";

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

function initialsOf(name: string) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "•";
}

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

  const location = [customer.city, customer.country].filter(Boolean).join(", ");
  const createdAt = (customer as { created_at?: string | null }).created_at;
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <SiteShell>
      <main>
        <PageHero
          title={t("greeting", { name: customer.full_name })}
          label={t("accountLabel")}
          image="/assets/images/heroes/pricing-header.jpg"
          summary={
            customer.verified ? t("verifiedSummary") : t("unverifiedSummary")
          }
        />
        <section className="section section-paper">
          <div className="container account-grid">
            {/* ── Identity / profile ── */}
            <aside className="account-profile">
              <div className="account-avatar" aria-hidden="true">
                {initialsOf(customer.full_name)}
              </div>
              <h2 className="account-profile-name">{customer.full_name}</h2>
              <p className="account-profile-email">{session.user.email}</p>
              <span
                className={`account-status-pill account-status-pill--${
                  customer.verified ? "verified" : "pending"
                }`}
              >
                {customer.verified ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M20 6 9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t("verified")}
                  </>
                ) : (
                  t("awaiting")
                )}
              </span>

              <dl className="account-details">
                <div>
                  <dt>{t("phone")}</dt>
                  <dd>{customer.phone || "—"}</dd>
                </div>
                <div>
                  <dt>{t("location")}</dt>
                  <dd>{location || "—"}</dd>
                </div>
                {memberSince ? (
                  <div>
                    <dt>{t("memberSince")}</dt>
                    <dd>{memberSince}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>{t("travelDocument")}</dt>
                  <dd>
                    {customer.passport_number
                      ? t("documentOnFile")
                      : t("documentMissing")}
                  </dd>
                </div>
              </dl>

              <form action={logoutAction} className="account-signout">
                <SubmitButton className="btn btn-line">
                  {t("signOut")}
                </SubmitButton>
              </form>
            </aside>

            {/* ── Main column ── */}
            <div className="account-main">
              {/* Journeys */}
              <section className="account-panel">
                <div className="account-panel-head">
                  <h3 className="account-panel-title">{t("yourBookings")}</h3>
                  {customer.verified && bookings.length > 0 ? (
                    <Link
                      className="btn btn-line account-panel-action"
                      href="/tours"
                    >
                      {t("browseJourneys")}
                    </Link>
                  ) : null}
                </div>

                {!customer.verified ? (
                  <p className="account-pending-note">{t("approvalNote")}</p>
                ) : null}

                {bookings.length === 0 ? (
                  <div className="account-empty">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p>{t("noBookings")}</p>
                    {customer.verified ? (
                      <Link className="btn btn-primary" href="/tours">
                        {t("browseJourneys")}
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <ul className="account-bookings">
                    {bookings.map((booking) => {
                      const payment = booking.payments?.[0];
                      const payable =
                        payment &&
                        payment.status !== "captured" &&
                        !isExpired(payment.pay_token_expires_at);

                      return (
                        <li className="account-booking" key={booking.id}>
                          <div className="account-booking-info">
                            <strong className="account-booking-title">
                              {booking.tour_packages?.title ?? t("journey")}
                            </strong>
                            <span className="account-booking-meta">
                              {booking.reference} · {booking.travel_dates}
                            </span>
                          </div>
                          <div className="account-booking-side">
                            <StatusBadge status={booking.status} />
                            {payable ? (
                              <Link
                                className="btn btn-primary account-booking-pay"
                                href={`/pay/${payment.pay_token}`}
                              >
                                {t("continuePayment")}
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Security */}
              <ChangePasswordWizard email={session.user.email} />

              {/* Danger zone — self-service account deletion */}
              <section className="account-panel account-danger-zone">
                <div className="account-panel-head">
                  <h3 className="account-panel-title">{t("deleteAccount")}</h3>
                </div>
                <p className="form-hint">{t("deleteAccountNote")}</p>
                <form action={deleteAccountAction}>
                  <DeleteAccountButton
                    label={t("deleteAccount")}
                    pendingLabel={t("deleteAccountPending")}
                    confirmText={t("deleteAccountConfirm")}
                  />
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
