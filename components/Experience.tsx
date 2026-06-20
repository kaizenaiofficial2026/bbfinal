import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Experience() {
  const t = useTranslations("home.experience");
  const steps = t.raw("steps") as { title: string; desc: string }[];

  return (
    <section className="section section-sand experience" id="experience">
      <div className="container experience-grid">
        <div className="experience-copy">
          <h2 className="display display-lg">{t("heading")}</h2>
          <p className="lead">{t("lead")}</p>

          <div className="timeline">
            {steps.map((s) => (
              <div className="timeline-item" key={s.title}>
                <span className="timeline-dot" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="experience-composition">
          <figure className="exp-photo one">
            <Image
              id="experienceImage"
              src="/assets/images/destinations/yala.jpg"
              alt="Peacock in Yala National Park"
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 56vw, 520px"
            />
          </figure>
          <figure className="exp-photo two">
            <Image
              src="/assets/images/destinations/galle.jpg"
              alt="Galle coastal lighthouse"
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 44vw, 330px"
            />
          </figure>
          <figure className="exp-photo three">
            <Image
              src="/assets/images/destinations/nuwara-eliya.jpg"
              alt="Tea landscape in Nuwara Eliya"
              fill
              sizes="(max-width: 720px) 180px, 250px"
            />
          </figure>
          <div className="experience-card">
            <strong>{t("cardBadge")}</strong>
            <span>{t("cardText")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
