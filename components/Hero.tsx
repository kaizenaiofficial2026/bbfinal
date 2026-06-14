import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-media">
        <Image
          id="heroImage"
          src="/assets/images/heroes/hero-image.jpg"
          alt="Sri Lanka landscape at golden hour"
          fill
          priority
          sizes="100vw"
        />
      </div>

      <div className="container hero-inner">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker hero-fade">
              Sri Lanka private travel design
            </p>
            <h1 className="hero-title" aria-label="Beyond Borders">
              <span className="hero-title-line">
                <span className="hero-title-word">Beyond</span>
              </span>
              <span className="hero-title-line">
                <span className="hero-title-word">
                  <em>Borders</em>
                </span>
              </span>
            </h1>
            <p className="hero-subtitle hero-fade">
              Handcrafted journeys through ancient kingdoms, misty tea country,
              leopard trails and warm Indian Ocean shores — designed in Colombo
              by people who know the island by heart.
            </p>
            <div className="hero-actions hero-fade">
              <Link className="btn btn-primary" href="/tours">
                Explore tours
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link className="btn btn-light" href="/destinations">
                View destinations
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
          </div>

          <aside className="hero-panel hero-fade" aria-label="Featured journey">
            <div className="hero-panel-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/destinations/sigiriya.jpg"
                alt="Sigiriya rock fortress rising above forest"
              />
            </div>
            <div className="hero-panel-body">
              <small>Featured route</small>
              <h2>From capital lights to ancient stone</h2>
              <p>
                A private rhythm from Colombo to Sigiriya, Kandy and the hill
                country, shaped around your pace.
              </p>
            </div>
          </aside>
        </div>

        <div className="hero-metrics hero-fade" data-reveal-group>
          <div className="hero-metric">
            <strong>12+</strong>
            <span>Island destinations</span>
          </div>
          <div className="hero-metric">
            <strong>4</strong>
            <span>Signature tour styles</span>
          </div>
          <div className="hero-metric">
            <strong>24/7</strong>
            <span>Dedicated assistance</span>
          </div>
          <div className="hero-metric">
            <strong>100%</strong>
            <span>Tailor-made journeys</span>
          </div>
        </div>
      </div>
      <a className="scroll-cue" href="#about">
        Scroll
      </a>
    </section>
  );
}
