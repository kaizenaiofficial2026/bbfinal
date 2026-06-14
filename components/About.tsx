import Image from "next/image";

export default function About() {
  return (
    <section className="section section-ivory about" id="about">
      <div className="container about-grid">
        <div className="about-copy" data-reveal>
          <span className="section-kicker">The Travel Partner</span>
          <h2 className="display display-lg">
            An island small enough to cross in a day, deep enough to explore for
            a lifetime.
          </h2>
          <p className="lead">
            Beyond Borders is a Colombo-based travel house crafting private
            journeys through Sri Lanka with polish, care and local fluency.
          </p>
          <p>
            From the eighth wonder of the world at Sigiriya to leopard country
            in Yala and the cool tea estates of Nuwara Eliya, every itinerary is
            shaped around you: your pace, your taste and your story.
          </p>

          <div className="about-stats" data-reveal-group>
            <div className="about-stat">
              <strong>
                <span data-count="12">0</span>+
              </strong>
              <span>Destinations curated across the island</span>
            </div>
            <div className="about-stat">
              <strong>
                <span data-count="4">0</span>
              </strong>
              <span>Signature tour collections</span>
            </div>
            <div className="about-stat">
              <strong>
                <span data-count="24">0</span>/7
              </strong>
              <span>On-trip support from landing to departure</span>
            </div>
            <div className="about-stat">
              <strong>
                <span data-count="100">0</span>%
              </strong>
              <span>Private and tailor-made by design</span>
            </div>
          </div>
        </div>

        <div className="about-composition" data-reveal>
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
