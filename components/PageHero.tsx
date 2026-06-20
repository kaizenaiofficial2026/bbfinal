import Image from "next/image";
import { Link } from "@/i18n/navigation";

type PageHeroProps = {
  title: string;
  label?: string;
  image: string;
  summary?: string;
  showBreadcrumbs?: boolean;
  showLabel?: boolean;
  backHref?: string;
  backLabel?: string;
};

export default function PageHero({
  title,
  label = "Beyond Borders",
  image,
  summary,
  showBreadcrumbs = true,
  showLabel = true,
  backHref,
  backLabel = "Back",
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="page-hero-image"
      />
      <div className="container page-hero-inner">
        {showBreadcrumbs ? (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>
        ) : null}
        {backHref ? (
          <Link className="page-hero-back" href={backHref}>
            {backLabel}
          </Link>
        ) : null}
        {showLabel ? (
          <span className="section-kicker page-hero-kicker">{label}</span>
        ) : null}
        <h1 className="display page-hero-title">{title}</h1>
        {summary ? <p>{summary}</p> : null}
      </div>
    </section>
  );
}
