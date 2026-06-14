import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-media">
        <video
          id="heroImage"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/assets/images/heroes/hero-airplane-coast.png"
          aria-hidden="true"
        >
          <source src="/assets/hero-bg.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="container hero-inner">
        <div className="hero-grid">
          <div className="hero-copy">
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
        </div>

      </div>
      <a className="scroll-cue" href="#about">
        Scroll
      </a>
    </section>
  );
}
