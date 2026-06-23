import Image from "next/image";
import { getTranslations } from "next-intl/server";
import ContactForm from "./ContactForm";

export default async function Contact() {
  const t = await getTranslations("contactPage");

  return (
    <section className="section contact" id="contact">
      <div className="contact-bg" aria-hidden="true">
        <Image
          id="contactImage"
          src="/assets/images/misc/cta.jpg"
          alt=""
          fill
          sizes="100vw"
        />
      </div>

      <div className="container contact-grid">
        <div className="contact-copy" data-reveal>
          <span className="section-kicker">{t("kicker")}</span>
          <h2 className="display display-lg">{t("heading")}</h2>
          <p className="lead">{t("lead")}</p>

          <div className="contact-details">
            <div className="contact-detail">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m6 7 6 5 6-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <strong>{t("emailLabel")}</strong>
                <a href="mailto:reservations@beyondborders.lk">reservations@beyondborders.lk</a>
              </div>
            </div>
            <div className="contact-detail">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.6 3.8 9 3.2a1.8 1.8 0 0 1 2 1.05l1 2.3a1.8 1.8 0 0 1-.45 2.08l-1.2 1.05a10.7 10.7 0 0 0 4 4l1.05-1.2a1.8 1.8 0 0 1 2.08-.45l2.3 1a1.8 1.8 0 0 1 1.05 2l-.6 2.4a2.2 2.2 0 0 1-2.28 1.67A15.2 15.2 0 0 1 4.93 6.08 2.2 2.2 0 0 1 6.6 3.8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <strong>{t("phoneLabel")}</strong>
                <a href="tel:+94112425087">+94 11 242 5087</a>
                <a href="tel:+94760979222">+94 76 097 9222</a>
              </div>
            </div>
            <div className="contact-detail">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              <div>
                <strong>{t("officeLabel")}</strong>
                <span>
                  3rd Floor, No. 430, R A De Mel Mawatha, Colombo 03, Sri Lanka
                </span>
              </div>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
