"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tours", label: "Tours" },
  { href: "/destinations", label: "Destinations" },
];

export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    const nav = navRef.current;
    const toggle = toggleRef.current;
    const backdrop = backdropRef.current;
    let lastY = window.scrollY;

    const setMenu = (open: boolean) => {
      document.body.classList.toggle("menu-open", open);
      toggle?.setAttribute("aria-expanded", String(open));
      toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    const onToggle = () => {
      setMenu(!document.body.classList.contains("menu-open"));
    };

    const onNavClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("a")) setMenu(false);
    };

    const onBackdropClick = () => {
      setMenu(false);
    };

    const onScroll = () => {
      const y = window.scrollY;
      header?.classList.toggle("is-scrolled", y > 24);

      if (
        y > 520 &&
        y > lastY &&
        !document.body.classList.contains("menu-open")
      ) {
        header?.classList.add("is-hidden");
      } else {
        header?.classList.remove("is-hidden");
      }

      lastY = y;
    };

    toggle?.addEventListener("click", onToggle);
    nav?.addEventListener("click", onNavClick);
    backdrop?.addEventListener("click", onBackdropClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      toggle?.removeEventListener("click", onToggle);
      nav?.removeEventListener("click", onNavClick);
      backdrop?.removeEventListener("click", onBackdropClick);
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("menu-open");
    };
  }, []);

  return (
    <header className="site-header" id="siteHeader" ref={headerRef}>
      <div className="container header-inner">
        <Link className="brand" href="/#hero" aria-label="Beyond Borders home">
          <Image
            src="/assets/images/brand/logo.png"
            alt="Beyond Borders"
            width={154}
            height={75}
            priority
          />
          <span className="brand-tag">The Travel Partner</span>
        </Link>

        <nav
          className="nav"
          id="siteNav"
          aria-label="Primary navigation"
          ref={navRef}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={isActive ? "nav-active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
          <Link className="mobile-nav-contact btn btn-line" href="/contacts">
            Contact Us
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
        </nav>
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label="Close menu"
          ref={backdropRef}
        />

        <div className="header-actions">
          <Link className="btn btn-line" href="/contacts">
            Contact Us
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
          <button
            className="menu-toggle"
            type="button"
            id="menuToggle"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="siteNav"
            ref={toggleRef}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
