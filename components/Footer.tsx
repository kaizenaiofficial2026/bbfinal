export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="footer-logo"
              src="/assets/images/brand/logo.png"
              alt="Beyond Borders"
              loading="lazy"
            />
            <p>
              Handcrafted private journeys across Sri Lanka, designed in Colombo
              and remembered long after the flight home.
            </p>
            <div className="socials" aria-label="Social links">
              <a href="#" aria-label="Facebook">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 8h2V4h-3a5 5 0 0 0-5 5v3H6v4h2v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M17.4 6.8h.01"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 10v8M7 7v.01M11 18v-8M11 13.5c0-2 1.2-3.5 3.2-3.5S18 11.4 18 14v4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3>Explore</h3>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#destinations">Destinations</a></li>
              <li><a href="#tours">Tours</a></li>
              <li><a href="#experience">Why Us</a></li>
            </ul>
          </div>

          <div>
            <h3>Destinations</h3>
            <ul>
              <li><a href="#destinations">Sigiriya</a></li>
              <li><a href="#destinations">Kandy</a></li>
              <li><a href="#destinations">Galle</a></li>
              <li><a href="#destinations">Yala</a></li>
            </ul>
          </div>

          <div>
            <h3>Contact</h3>
            <ul>
              <li><a href="mailto:info@beyondborders.lk">info@beyondborders.lk</a></li>
              <li><a href="tel:+94112425087">+94 11 242 5087</a></li>
              <li>Colombo 03, Sri Lanka</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 Beyond Borders. All rights reserved.</span>
          <span>The Travel Partner</span>
        </div>
      </div>
    </footer>
  );
}
