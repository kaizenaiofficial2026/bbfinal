import Image from "next/image";
import Link from "next/link";

const ABOUT_STATS = [
  { value: "500+", label: "Happy Travellers" },
  { value: "10+", label: "Destinations" },
  { value: "5★", label: "Rated Service" },
  { value: "4+", label: "Tour Packages" },
];

export default function About() {
  return (
    <section className="section section-ivory about" id="about">
      <div className="container about-grid">
        <div className="about-copy" data-reveal-group="copy">
          <span className="section-kicker">Learn More</span>
          <h2 className="display display-lg">
            Traveling. Tours. Adventure.
          </h2>
          <p className="lead">
            Beyond Borders is a leading travel and tourism company in Sri Lanka,
            offering tailor-made travel packages to suit your passions, time,
            and budget.
          </p>
          <p>
            We understand the stress of planning that perfect holiday… whether
            you are looking for an idyllic break or a fun-filled adventure for
            the whole family. At Beyond Borders, our experts take care to listen
            to your needs and interests, and design a trip just for you.
          </p>
          <p>
            With wide experiences in the travel and tourism sector, our packages
            come at unbeatable value, as we help you make lasting memories.
          </p>

          <div className="about-actions">
            <Link className="btn about-action-primary" href="/contacts">
              GET IN TOUCH
            </Link>
            <Link className="btn about-action-dark" href="/destinations">
              VIEW ATTRACTIONS
            </Link>
          </div>

          <div className="about-stats" data-reveal-group="cards">
            {ABOUT_STATS.map((stat) => (
              <div className="about-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
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
            <strong>Designed in Colombo</strong>
            Your journey is shaped by local planners, trusted guides and hotel
            partners across the island.
          </p>
        </div>
      </div>
    </section>
  );
}
