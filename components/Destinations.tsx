import Image from "next/image";
import Link from "next/link";

const PANELS = [
  {
    href: "/sigiriya",
    img: "/assets/images/destinations/sigiriya.jpg",
    alt: "Sigiriya rock fortress above jungle",
    tag: "UNESCO",
    index: "01",
    title: "Sigiriya",
    desc: "The eighth wonder of the world, where water gardens, frescoes and stone stairways rise from the forest.",
  },
  {
    href: "/kandy",
    img: "/assets/images/destinations/kandy.jpg",
    alt: "Kandy temple and lake",
    tag: "Sacred city",
    index: "02",
    title: "Kandy",
    desc: "Home of the Sacred Tooth Relic, botanical gardens and evenings wrapped in temple bells.",
  },
  {
    href: "/galle",
    img: "/assets/images/destinations/galle-fort.jpg",
    alt: "Galle Fort coast and lighthouse",
    tag: "Coastal fort",
    index: "03",
    title: "Galle",
    desc: "Dutch ramparts, sea air, boutique lanes and sunset walks along the largest remaining fortress in Asia.",
  },
  {
    href: "/nuwara-eliya",
    img: "/assets/images/destinations/nuwara-eliya-2.jpg",
    alt: "Nuwara Eliya tea estates and mountains",
    tag: "Tea country",
    index: "04",
    title: "Nuwara Eliya",
    desc: "Little England in the highlands, with tea estates, cool mornings and one of the world's most scenic train routes.",
  },
  {
    href: "/yala",
    img: "/assets/images/destinations/yala-2.jpg",
    alt: "Wild landscape in Yala National Park",
    tag: "Safari",
    index: "05",
    title: "Yala",
    desc: "Leopard country, coastal lagoons and dawn safaris through Sri Lanka's most visited national park.",
  },
  {
    href: "/trincomalee",
    img: "/assets/images/destinations/trincomalee.jpg",
    alt: "Trincomalee coastline and natural harbor",
    tag: "Blue coast",
    index: "06",
    title: "Trincomalee",
    desc: "A natural harbor, Nilaveli Beach, Koneswaram Temple and whale watching in season.",
  },
  {
    href: "/colombo",
    img: "/assets/images/destinations/colombo.jpg",
    alt: "Colombo city skyline and coast",
    tag: "Capital",
    index: "07",
    title: "Colombo",
    desc: "The island's beating capital, from Galle Face Green and Gangaramaya Temple to markets and skyline dinners.",
  },
  {
    href: "/bentota",
    img: "/assets/images/destinations/bentota.jpg",
    alt: "Bentota beach and river",
    tag: "Beach",
    index: "08",
    title: "Bentota",
    desc: "Golden sand, Madu River, turtle hatcheries and slow coastal days designed around warm water.",
  },
];

export default function Destinations() {
  return (
    <section className="destinations" id="destinations">
      <div className="dest-sticky">
        <div className="container">
          <div className="dest-head" data-reveal>
            <div>
              <span className="section-kicker">Island atlas</span>
              <h2 className="display display-lg">
                Eight cinematic chapters of Sri Lanka.
              </h2>
            </div>
            <p className="lead">
              Move from carved stone and sacred cities to tea mist, surf breaks
              and wild national parks without losing the feeling of a single
              beautifully held journey.
            </p>
          </div>
        </div>

        <div className="dest-window" aria-label="Featured destinations">
          <div className="dest-track" id="destTrack" data-reveal-group>
            {PANELS.map((p) => (
              <Link className="dest-panel" href={p.href} key={p.index}>
                <Image
                  src={p.img}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 76vw"
                />
                <span className="dest-tag">{p.tag}</span>
                <div className="dest-content">
                  <span className="dest-index">{p.index}</span>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="container">
          <div className="dest-progress" aria-hidden="true">
            <span id="destProgress" />
          </div>
        </div>
      </div>
    </section>
  );
}
