import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image
              className="footer-logo"
              src="/assets/images/brand/logo.png"
              alt="Beyond Borders"
              width={154}
              height={75}
              unoptimized
            />
            <p>{t("blurb")}</p>
            <div className="socials" aria-label="Social links">
              <a
                href="https://www.facebook.com/p/Beyond-Borders-100085648405257/"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 8h2V4h-3a5 5 0 0 0-5 5v3H6v4h2v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M17.4 6.8h.01"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 10v8M7 7v.01M11 18v-8M11 13.5c0-2 1.2-3.5 3.2-3.5S18 11.4 18 14v4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3>{t("explore")}</h3>
            <ul>
              <li><Link href="/">{tNav("home")}</Link></li>
              <li><Link href="/about">{tNav("about")}</Link></li>
              <li><Link href="/tours">{tNav("tours")}</Link></li>
              <li><Link href="/destinations">{tNav("destinations")}</Link></li>
              <li><Link href="/contacts">{tCommon("contactUs")}</Link></li>
            </ul>
          </div>

          <div>
            <h3>{t("destinations")}</h3>
            <ul>
              <li><Link href="/sigiriya">{t("dest.sigiriya")}</Link></li>
              <li><Link href="/kandy">{t("dest.kandy")}</Link></li>
              <li><Link href="/galle">{t("dest.galle")}</Link></li>
              <li><Link href="/yala">{t("dest.yala")}</Link></li>
              <li><Link href="/polonnaruwa">{t("dest.polonnaruwa")}</Link></li>
            </ul>
          </div>

          <div>
            <h3>{t("contact")}</h3>
            <ul>
              <li><a href="mailto:reservations@beyondborders.lk">reservations@<wbr />beyondborders.lk</a></li>
              <li><a href="tel:+94112425087">+94 11 242 5087</a></li>
              <li><a href="tel:+94760979222">+94 76 097 9222</a></li>
              <li>Colombo 03, Sri Lanka</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{t("rights")}</span>
          <span>{t("tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
