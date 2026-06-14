"use client";

import { useEffect } from "react";
import { animate, inView, scroll, stagger } from "motion";
import Lenis from "lenis";

export default function SiteEffects() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Everything created below registers a disposer so the effect tears down
    // cleanly on unmount (and re-runs safely under React Strict Mode).
    let cancelled = false;
    const disposers: Array<() => void> = [];

    const cleanupLoading = () => {
      body.classList.remove("is-loading");
      document.getElementById("preloader")?.classList.add("is-hidden");
      document
        .querySelectorAll(
          "[data-reveal], [data-reveal-group] > *, .hero-fade, .hero-title-word",
        )
        .forEach((el) => {
          (el as HTMLElement).style.opacity = "";
          (el as HTMLElement).style.transform = "";
        });
    };

    const failSafe = window.setTimeout(cleanupLoading, 3200);
    disposers.push(() => window.clearTimeout(failSafe));

    const run = async () => {
      try {
        window.clearTimeout(failSafe);

        if (reduced) {
          cleanupLoading();
          return;
        }

        html.classList.add("has-motion");
        await runIntro();
        if (cancelled) return;
        initSmoothScroll();
        initReveals();
        initCounters();
        initParallax();
        initDestinations();
      } catch (error) {
        console.warn("Motion failed to load:", error);
        cleanupLoading();
      }
    };

    function initSmoothScroll() {
      if (reduced) return;

      const lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1,
        smoothWheel: true,
      });

      let rafId = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      const onLoad = () => lenis.resize();
      window.addEventListener("load", onLoad);

      const headerOffset =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header",
          ),
          10,
        ) || 82;

      const anchors =
        document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
      const onAnchorClick = (event: Event) => {
        const anchor = event.currentTarget as HTMLAnchorElement;
        const id = anchor.getAttribute("href");
        if (!id || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        document.body.classList.remove("menu-open");
        lenis.scrollTo(target as HTMLElement, { offset: -headerOffset });
      };
      anchors.forEach((a) => a.addEventListener("click", onAnchorClick));

      disposers.push(() => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("load", onLoad);
        anchors.forEach((a) =>
          a.removeEventListener("click", onAnchorClick),
        );
        lenis.destroy();
      });
    }

    async function runIntro() {
      const preloader = document.getElementById("preloader");
      const preloaderNum = document.getElementById("preloaderNum");
      const preloaderRule = document.getElementById("preloaderRule");

      try {
        if (preloaderRule) preloaderRule.style.transform = "scaleX(0)";
        animate(
          ".preloader-word .ch",
          { y: ["120%", "0%"] },
          { duration: 0.85, delay: stagger(0.028), ease: [0.22, 1, 0.36, 1] },
        );

        await waitForPageAssets((progress) => {
          const value = Math.min(100, Math.max(0, Math.round(progress)));
          if (preloaderNum) preloaderNum.textContent = String(value);
          if (preloaderRule) {
            animate(
              preloaderRule,
              { scaleX: value / 100 },
              { duration: 0.22, ease: "easeOut" },
            );
          }
        });

        await delay(260);
        await Promise.race([
          animate(
            preloader as HTMLElement,
            { y: ["0%", "-100%"] },
            { duration: 0.78, ease: [0.76, 0, 0.24, 1] },
          ),
          delay(950),
        ]);
      } finally {
        preloader?.classList.add("is-hidden");
        body.classList.remove("is-loading");
      }

      if (cancelled) return;

      animate(
        "#heroImage",
        { scale: [1.04, 1], opacity: [0.65, 1] },
        { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
      );
      animate(
        ".hero-title-word",
        { y: [18, 0] },
        {
          duration: 1.08,
          delay: stagger(0.13, { startDelay: 0.12 }),
          ease: [0.22, 1, 0.36, 1],
        },
      );
      animate(
        ".hero-fade",
        { y: [18, 0] },
        {
          duration: 0.9,
          delay: stagger(0.12, { startDelay: 0.62 }),
          ease: [0.22, 1, 0.36, 1],
        },
      );
    }

    async function waitForPageAssets(onProgress: (progress: number) => void) {
      const imageUrls = Array.from(document.images)
        .map((img) => img.currentSrc || img.getAttribute("src"))
        .filter((src): src is string => Boolean(src))
        .map((src) => new URL(src, document.baseURI).href);

      const uniqueImageUrls = Array.from(new Set(imageUrls));
      const tasks = [
        ...uniqueImageUrls.map((src) => loadImage(src)),
        waitForFonts(),
        waitForDocumentLoad(),
      ];

      let completed = 0;
      const total = Math.max(tasks.length, 1);
      onProgress(4);

      await Promise.all(
        tasks.map((task) =>
          task.finally(() => {
            completed += 1;
            onProgress((completed / total) * 100);
          }),
        ),
      );

      onProgress(100);
    }

    function loadImage(src: string) {
      return new Promise<void>((resolve) => {
        const img = new Image();
        const finish = () => {
          if (img.decode) {
            img
              .decode()
              .catch(() => undefined)
              .finally(() => resolve());
          } else {
            resolve();
          }
        };

        img.onload = finish;
        img.onerror = () => resolve();
        img.src = src;

        if (img.complete) finish();
      });
    }

    function waitForFonts() {
      if (!document.fonts || !document.fonts.ready) return Promise.resolve();
      return document.fonts.ready.catch(() => undefined);
    }

    function waitForDocumentLoad() {
      if (document.readyState === "complete") return Promise.resolve();
      return new Promise<void>((resolve) => {
        window.addEventListener("load", () => resolve(), { once: true });
      });
    }

    function delay(ms: number) {
      return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    }

    function initReveals() {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        const stop = inView(
          el,
          () => {
            animate(
              el,
              { y: [28, 0] },
              { duration: 0.84, ease: [0.22, 1, 0.36, 1] },
            );
          },
          { amount: 0.18, margin: "0px 0px -10% 0px" },
        );
        disposers.push(stop);
      });

      document.querySelectorAll("[data-reveal-group]").forEach((group) => {
        const stop = inView(
          group,
          () => {
            animate(
              Array.from(group.children),
              { y: [28, 0] },
              {
                duration: 0.84,
                delay: stagger(0.08),
                ease: [0.22, 1, 0.36, 1],
              },
            );
          },
          { amount: 0.14, margin: "0px 0px -10% 0px" },
        );
        disposers.push(stop);
      });
    }

    function initCounters() {
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number.parseInt(el.dataset.count || "0", 10);
        const stop = inView(
          el,
          () => {
            animate(0, target, {
              duration: 1.65,
              ease: [0.22, 1, 0.36, 1],
              onUpdate: (value: number) => {
                el.textContent = String(Math.round(value));
              },
            });
          },
          { amount: 0.7 },
        );
        disposers.push(stop);
      });
    }

    function initParallax() {
      const hero = document.getElementById("hero");
      const heroImage = document.getElementById("heroImage");
      const heroCopy = document.querySelector<HTMLElement>(".hero-copy");
      const aboutImage = document.getElementById("aboutImage");
      const experienceImage = document.getElementById("experienceImage");
      const contactImage = document.getElementById("contactImage");

      if (hero) {
        disposers.push(
          scroll(
            (progress: number) => {
              if (heroImage)
                heroImage.style.setProperty("translate", `0 ${progress * 4}%`);
              if (heroCopy) {
                heroCopy.style.opacity = String(
                  1 - Math.min(0.72, progress * 1.25),
                );
                heroCopy.style.setProperty("translate", `0 ${progress * 54}px`);
              }
            },
            { target: hero, offset: ["start start", "end start"] },
          ),
        );
      }

      if (aboutImage) {
        disposers.push(
          scroll(
            (progress: number) => {
              aboutImage.style.setProperty("translate", `0 ${-progress * 9}%`);
            },
            {
              target: aboutImage.closest(".about-composition") as HTMLElement,
              offset: ["start end", "end start"],
            },
          ),
        );
      }

      if (experienceImage) {
        disposers.push(
          scroll(
            (progress: number) => {
              experienceImage.style.setProperty(
                "translate",
                `0 ${(progress - 0.5) * 11}%`,
              );
            },
            {
              target: experienceImage.closest(
                ".experience-composition",
              ) as HTMLElement,
              offset: ["start end", "end start"],
            },
          ),
        );
      }

      if (contactImage) {
        disposers.push(
          scroll(
            (progress: number) => {
              contactImage.style.setProperty(
                "translate",
                `0 ${(progress - 0.5) * 8}%`,
              );
            },
            {
              target: document.querySelector(".contact") as HTMLElement,
              offset: ["start end", "end start"],
            },
          ),
        );
      }
    }

    function initDestinations() {
      const section = document.getElementById("destinations");
      const sticky = section?.querySelector(".dest-sticky");
      const track = document.getElementById("destTrack");
      const progressBar = document.getElementById("destProgress");
      const desktop = window.matchMedia("(min-width: 980px)");
      let distance = 0;

      if (!section || !sticky || !track) return;

      const measure = () => {
        if (!desktop.matches) {
          section.classList.remove("is-ready");
          section.style.height = "";
          track.style.transform = "";
          if (progressBar) progressBar.style.width = "";
          return;
        }

        section.classList.add("is-ready");
        distance = Math.max(0, track.scrollWidth - window.innerWidth + 48);
        section.style.height = `${window.innerHeight + distance}px`;
      };

      measure();
      window.addEventListener("resize", measure, { passive: true });
      desktop.addEventListener("change", measure);

      const stop = scroll(
        (progress: number) => {
          if (!desktop.matches) return;
          track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`;
          if (progressBar) progressBar.style.width = `${progress * 100}%`;
        },
        { target: section, offset: ["start start", "end end"] },
      );

      disposers.push(() => {
        window.removeEventListener("resize", measure);
        desktop.removeEventListener("change", measure);
        stop();
        section.style.height = "";
      });
    }

    run();

    return () => {
      cancelled = true;
      disposers.forEach((dispose) => dispose());
    };
  }, []);

  return null;
}
