import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function HomeCTA() {
  const t = useTranslations("home.cta");
  const tCommon = useTranslations("common");

  return (
    <section className="contact-cta" id="contact">
      <div className="contact-cta-bg" aria-hidden="true">
        <Image
          id="contactImage"
          src="/assets/images/misc/cta.jpg"
          alt=""
          fill
          sizes="100vw"
          priority={false}
        />
      </div>

      <div className="contact-cta-scrim" aria-hidden="true" />

      <div className="contact-cta-body">
        <h2 className="display display-lg contact-cta-heading">{t("heading")}</h2>
        <p className="contact-cta-sub">{t("sub")}</p>
        <Link className="btn btn-primary contact-cta-btn" href="/contacts">
          {tCommon("contactUs")}
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 17 17 7M9 7h8v8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
