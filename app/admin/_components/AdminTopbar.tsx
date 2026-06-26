"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Mobile-only top bar (logo + hamburger) that toggles the sidebar as an
 * off-canvas drawer. On desktop the bar and backdrop are hidden and the
 * sidebar stays docked. Mirrors the public header's drawer pattern: body class
 * drives the CSS, and the menu closes on link tap, backdrop tap, or Escape.
 */
export default function AdminTopbar() {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const toggle = toggleRef.current;
    const backdrop = backdropRef.current;
    const sidebar = document.getElementById("adminSidebar");

    const setOpen = (open: boolean) => {
      document.body.classList.toggle("admin-menu-open", open);
      toggle?.setAttribute("aria-expanded", String(open));
      toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    const onToggle = () =>
      setOpen(!document.body.classList.contains("admin-menu-open"));
    const onSidebarClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("a")) setOpen(false);
    };
    const onBackdrop = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    toggle?.addEventListener("click", onToggle);
    sidebar?.addEventListener("click", onSidebarClick);
    backdrop?.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKey);

    return () => {
      toggle?.removeEventListener("click", onToggle);
      sidebar?.removeEventListener("click", onSidebarClick);
      backdrop?.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("admin-menu-open");
    };
  }, []);

  return (
    <>
      <div className="admin-topbar">
        <Link
          className="admin-topbar-brand"
          href="/admin"
          aria-label="Beyond Borders admin home"
        >
          <Image
            className="admin-logo"
            src="/assets/images/brand/logo.png"
            alt="Beyond Borders"
            width={120}
            height={58}
            priority
            unoptimized
          />
        </Link>
        <button
          ref={toggleRef}
          className="admin-menu-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded="false"
          aria-controls="adminSidebar"
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <button
        ref={backdropRef}
        className="admin-backdrop"
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
      />
    </>
  );
}
