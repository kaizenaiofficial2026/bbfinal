const STEPS = [
  {
    title: "Tailor-made itineraries",
    desc: "No fixed routes. Every journey is drawn around your pace, taste and curiosity.",
  },
  {
    title: "Local expertise",
    desc: "Planned in Colombo by people who know the island's stories, roads and quiet details first-hand.",
  },
  {
    title: "24/7 dedicated assistant",
    desc: "One person, always reachable, from the moment you land until you fly home.",
  },
  {
    title: "Seamless transfers",
    desc: "Private, air-conditioned travel door to door, with airport pickup included, always.",
  },
];

export default function Experience() {
  return (
    <section className="section section-sand experience" id="experience">
      <div className="container experience-grid">
        <div className="experience-copy" data-reveal>
          <span className="section-kicker">Journey design</span>
          <h2 className="display display-lg">
            What changes when the island is planned around you.
          </h2>
          <p className="lead">
            Beyond Borders combines local planning, private movement and
            personal assistance so every day feels held, but never overmanaged.
          </p>

          <div className="timeline">
            {STEPS.map((s) => (
              <div className="timeline-item" data-reveal key={s.title}>
                <span className="timeline-dot" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="experience-composition" data-reveal>
          <figure className="exp-photo one">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              id="experienceImage"
              src="/assets/images/destinations/yala.jpg"
              alt="Peacock in Yala National Park"
              loading="lazy"
            />
          </figure>
          <figure className="exp-photo two">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/destinations/galle.jpg"
              alt="Galle coastal lighthouse"
              loading="lazy"
            />
          </figure>
          <figure className="exp-photo three">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/destinations/nuwara-eliya.jpg"
              alt="Tea landscape in Nuwara Eliya"
              loading="lazy"
            />
          </figure>
          <div className="experience-card">
            <strong>5-star</strong>
            <span>
              Partner hotels, private transfers and attentive on-trip support.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
