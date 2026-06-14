import Image from "next/image";
import Link from "next/link";

type PageHeroProps = {
  title: string;
  label?: string;
  image: string;
  summary?: string;
};

export default function PageHero({
  title,
  label = "Beyond Borders",
  image,
  summary,
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
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>
        <span className="section-kicker page-hero-kicker">{label}</span>
        <h1 className="display page-hero-title">{title}</h1>
        {summary ? <p>{summary}</p> : null}
      </div>
    </section>
  );
}
