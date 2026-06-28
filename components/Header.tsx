"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { logoutAction } from "@/app/[locale]/account/actions";

type HeaderAccount = { name: string } | null;

const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/tours", key: "tours" },
  { href: "/destinations", key: "destinations" },
  { href: "/custom-quote", key: "customQuote" },
  { href: "/about", key: "about" },
] as const;

export default function Header({ account }: { account: HeaderAccount }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const firstName = account ? account.name.split(" ")[0] : "";
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
            unoptimized
          />
        </Link>

        <nav
          className="nav"
          id="siteNav"
          aria-label="Primary navigation"
          ref={navRef}
        >
          {NAV_LINKS.map(({ href, key }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={isActive ? "nav-active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {t(key)}
              </Link>
            );
          })}
          <Link
            href="/contacts"
            className={
              pathname.startsWith("/contacts") ? "nav-active" : undefined
            }
            aria-current={pathname.startsWith("/contacts") ? "page" : undefined}
          >
            {tCommon("contactUs")}
          </Link>
          <div className="mobile-nav-auth">
            {account ? (
              <>
                <Link className="auth-secondary" href="/account">
                  {tAuth("greeting", { name: firstName })}
                </Link>
                <form action={logoutAction}>
                  <button className="auth-primary" type="submit">
                    {tAuth("signOut")}
                  </button>
                </form>
              </>
            ) : (
              <Link className="auth-primary" href="/login">
                {tAuth("signIn")}
              </Link>
            )}
          </div>
        </nav>
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label="Close menu"
          ref={backdropRef}
        />

        <div className="header-actions">
          <LocaleSwitcher />
          <div className="header-auth">
            {account ? (
              <>
                <Link
                  className="btn btn-line header-account-link"
                  href="/account"
                >
                  {tAuth("greeting", { name: firstName })}
                </Link>
                <form action={logoutAction}>
                  <button className="btn btn-primary" type="submit">
                    {tAuth("signOut")}
                  </button>
                </form>
              </>
            ) : (
              <Link className="btn btn-primary" href="/login">
                {tAuth("signIn")}
              </Link>
            )}
          </div>
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
