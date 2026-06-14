import Link from "next/link";

type CTASectionProps = {
  title: string;
  text: string;
  href?: string;
  action?: string;
};

export default function CTASection({
  title,
  text,
  href = "/contacts",
  action = "Contact us",
}: CTASectionProps) {
  return (
    <section className="cta-strip">
      <div className="container cta-strip-inner">
        <div>
          <span className="section-kicker">Start planning</span>
          <h2 className="display display-md">{title}</h2>
          <p>{text}</p>
        </div>
        <Link className="btn btn-primary" href={href}>
          {action}
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
      </div>
    </section>
  );
}
