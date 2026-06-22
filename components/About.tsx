import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const ABOUT_STAT_VALUES = ["500+", "10+", "5★", "4+"];

export default async function About() {
  const t = await getTranslations("aboutPage");
  const statLabels = t.raw("statLabels") as string[];

  return (
    <section className="section section-ivory about" id="about">
      <div className="container about-grid">
        <div className="about-copy" data-reveal-group="copy">
          <span className="section-kicker">{t("kicker")}</span>
          <h2 className="display display-lg">{t("heading")}</h2>
          <p className="lead">{t("lead")}</p>
          <p>{t("para2")}</p>
          <p>{t("para3")}</p>

          <div className="about-actions">
            <Link className="btn about-action-primary" href="/contacts">
              {t("getInTouch")}
            </Link>
            <Link className="btn about-action-dark" href="/destinations">
              {t("viewAttractions")}
            </Link>
          </div>

          <div className="about-stats" data-reveal-group="cards">
            {ABOUT_STAT_VALUES.map((value, index) => (
              <div className="about-stat" key={value}>
                <strong>{value}</strong>
                <span>{statLabels[index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="about-composition" data-about-media>
          <figure className="about-image-main">
            <Image
              id="aboutImage"
              src="/assets/images/heroes/about-header.jpg"
              alt="Travelers viewing Sri Lankan highlands"
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 52vw, 640px"
            />
          </figure>
          <figure className="about-image-small">
            <Image
              src="/assets/images/destinations/kandy.jpg"
              alt="Temple of the Sacred Tooth Relic in Kandy"
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 46vw, 320px"
            />
          </figure>
          <figure className="about-medallion">
            <Image
              src="/assets/images/misc/about-travel.jpg"
              alt="Travelers exploring Sri Lanka"
              fill
              sizes="180px"
            />
          </figure>
          <p className="about-note">
            <strong>{t("noteTitle")}</strong>
            {t("noteText")}
          </p>
        </div>
      </div>
    </section>
  );
}
