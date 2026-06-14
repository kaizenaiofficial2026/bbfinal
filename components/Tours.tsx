import Image from "next/image";

const CARDS = [
  {
    img: "/assets/images/destinations/bentota.jpg",
    alt: "Bentota beach tour",
    badge: "Beach",
    title: "Sunbath on Sands",
    desc: "Colombo to Bentota, with river safaris, turtle hatcheries and five-star leisure by the sea.",
    meta: ["4 days / 3 nights", "Colombo + Bentota"],
  },
  {
    img: "/assets/images/tours/classic-city.jpg",
    alt: "Classic Colombo city tour",
    badge: "Classic",
    title: "A Classic of the City",
    desc: "The essential Colombo, with colonial quarters, temples, bazaars and an unhurried rhythm.",
    meta: ["4 days / 3 nights", "Quality hotels"],
  },
  {
    img: "/assets/images/tours/heart-of-city.jpg",
    alt: "Short Colombo city break",
    badge: "Standard",
    title: "The Heart of City",
    desc: "A perfect short break, with two nights in the heart of Colombo and the highlights handled.",
    meta: ["3 days / 2 nights", "3-star hotels"],
  },
];

export default function Tours() {
  return (
    <section className="section section-paper" id="tours">
      <div className="container">
        <div className="tours-head" data-reveal>
          <div>
            <span className="section-kicker">Signature tours</span>
            <h2 className="display display-lg">Journeys with space for wonder.</h2>
          </div>
          <p className="lead">
            Each tour includes airport transfers, daily breakfast and a
            dedicated Beyond Borders assistant, then adapts to how you prefer to
            travel.
          </p>
        </div>

        <div className="tour-layout">
          <article className="tour-feature" data-reveal>
            <Image
              src="/assets/images/tours/glamour-sri-lanka.jpg"
              alt="Travelers on a curated Sri Lanka experience"
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 100vw, 58vw"
            />
            <div className="tour-feature-body">
              <span className="tour-badge">Luxury</span>
              <h3>Glamour of Sri Lanka</h3>
              <p>
                Colombo at its most indulgent, with five-star living, fine
                dining and the capital&apos;s hidden glamour curated end to end.
              </p>
              <div className="tour-meta">
                <span>4 days / 3 nights</span>
                <span>5-star hotels</span>
                <span>Colombo</span>
              </div>
            </div>
          </article>

          <div>
            <div className="tour-list" data-reveal-group>
              {CARDS.map((c) => (
                <article className="tour-card" key={c.title}>
                  <div className="tour-card-image">
                    <Image
                      src={c.img}
                      alt={c.alt}
                      fill
                      sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 168px"
                    />
                  </div>
                  <div className="tour-card-body">
                    <span className="tour-badge">{c.badge}</span>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                    <div className="tour-meta">
                      {c.meta.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="inclusion-strip" data-reveal-group>
              <span>Airport transfers</span>
              <span>Daily breakfast</span>
              <span>Dedicated assistant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
