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
                <svg aria-hidden="true" viewBox="0 0 320 512" fill="currentColor">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/beyondborderslk/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/beyond-borders-pvt-ltd/?viewAsMember=true"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg aria-hidden="true" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
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
              <li>{t("location")}</li>
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
