"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { animate, inView, scroll, stagger } from "motion";
import Lenis from "lenis";

let introHasPlayed = false;

export default function SiteEffects() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Everything created below registers a disposer so the effect tears down
    // cleanly on unmount (and re-runs safely under React Strict Mode).
    let cancelled = false;
    const disposers: Array<() => void> = [];
    const animatedSelector =
      "[data-reveal], [data-reveal-group] > *, [data-about-media] > *, .hero-fade, .hero-title-word";

    html.classList.remove("reveal-ready");
    document
      .querySelectorAll<HTMLElement>('[data-reveal-group="package-cards"]')
      .forEach((group) => {
        group.classList.remove("package-cards-ready", "is-visible");
      });
    document
      .querySelectorAll(".reveal-pending, .reveal-armed, .is-revealed")
      .forEach((el) => {
        el.classList.remove("reveal-pending", "reveal-armed", "is-revealed");
      });

    const hidePreloader = () => {
      body.classList.remove("is-loading");
      document.getElementById("preloader")?.classList.add("is-hidden");
    };

    const cleanupLoading = () => {
      html.classList.remove("has-motion");
      html.classList.remove("reveal-ready");
      hidePreloader();
      document
        .querySelectorAll(".reveal-pending, .reveal-armed, .is-revealed")
        .forEach((el) => {
          el.classList.remove("reveal-pending", "reveal-armed", "is-revealed");
        });
      document.querySelectorAll(animatedSelector).forEach((el) => {
        (el as HTMLElement).style.opacity = "";
        (el as HTMLElement).style.transform = "";
      });
    };

    const failSafe = window.setTimeout(cleanupLoading, 3200);
    disposers.push(() => window.clearTimeout(failSafe));

    const run = async () => {
      try {
        if (reduced) {
          window.clearTimeout(failSafe);
          cleanupLoading();
          return;
        }

        html.classList.add("has-motion");
        if (!introHasPlayed && body.classList.contains("is-loading")) {
          await runIntro();
          if (cancelled) return;
          introHasPlayed = true;
        } else {
          hidePreloader();
          introHasPlayed = true;
        }
        if (cancelled) return;
        html.classList.add("has-motion");
        initSmoothScroll();
        initReveals();
        initCounters();
        initParallax();
        window.clearTimeout(failSafe);
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
        const preloaderChars = document.querySelectorAll(".preloader-word .ch");
        if (preloaderChars.length) {
          animate(
            preloaderChars,
            { y: ["120%", "0%"] },
            {
              duration: 0.85,
              delay: stagger(0.028),
              ease: [0.22, 1, 0.36, 1],
            },
          );
        }

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
        if (preloader) {
          await Promise.race([
            animate(
              preloader,
              { y: ["0%", "-100%"] },
              { duration: 0.78, ease: [0.76, 0, 0.24, 1] },
            ),
            delay(950),
          ]);
        }
      } finally {
        preloader?.classList.add("is-hidden");
        body.classList.remove("is-loading");
      }

      if (cancelled) return;

      const heroImage = document.getElementById("heroImage");
      if (heroImage) {
        animate(
          heroImage,
          { opacity: [0.65, 1] },
          { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
        );
      }
      const heroTitleWords = document.querySelectorAll(".hero-title-word");
      if (heroTitleWords.length) {
        animate(
          heroTitleWords,
          { y: [18, 0] },
          {
            duration: 1.08,
            delay: stagger(0.13, { startDelay: 0.12 }),
            ease: [0.22, 1, 0.36, 1],
          },
        );
      }

      const heroFades = document.querySelectorAll(".hero-fade");
      if (heroFades.length) {
        animate(
          heroFades,
          { y: [18, 0] },
          {
            duration: 0.9,
            delay: stagger(0.12, { startDelay: 0.62 }),
            ease: [0.22, 1, 0.36, 1],
          },
        );
      }
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

    function markRevealed(el: Element) {
      if (cancelled) return;
      el.classList.add("is-revealed");
      getRevealItems(el).forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0) scale(1) rotate(0)";
      });

      window.setTimeout(() => {
        if (cancelled) return;
        getRevealItems(el).forEach((item) => {
          item.style.transition = "none";
          item.style.opacity = "1";
          item.style.transform = "translateY(0) scale(1) rotate(0)";
          item.style.willChange = "";
        });
      }, 1280);
    }

    function armReveal(
      el: Element,
      onReveal: () => void,
      options: {
        amount: number;
        margin: "0px 0px -10% 0px" | "0px 0px -12% 0px";
      },
    ) {
      el.classList.add("reveal-pending");
      prepareRevealStyles(el);
      el.classList.add("reveal-armed");
      const stop = watchInView(el, onReveal, options);

      return () => {
        stop();
        clearRevealStyles(el);
        el.classList.remove("reveal-pending", "reveal-armed", "is-revealed");
      };
    }

    function prepareRevealStyles(el: Element) {
      const transform = getRevealTransform(el);
      const items = getRevealItems(el);

      items.forEach((item) => {
        item.style.transition = "none";
        item.style.opacity = "0";
        item.style.transform = transform;
        item.style.willChange = "opacity, transform";
      });

      el.getBoundingClientRect();

      items.forEach((item, index) => {
        const delayMs = items.length > 1 ? Math.min(index * 80, 400) : 0;
        item.style.transition = [
          `opacity 680ms var(--ease) ${delayMs}ms`,
          `transform 860ms var(--ease) ${delayMs}ms`,
        ].join(", ");
      });
    }

    function clearRevealStyles(el: Element) {
      getRevealItems(el).forEach((item) => {
        item.style.opacity = "";
        item.style.transform = "";
        item.style.transition = "";
        item.style.willChange = "";
      });
    }

    function getRevealItems(el: Element) {
      if (el.hasAttribute("data-reveal")) return [el as HTMLElement];
      return Array.from(el.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement,
      );
    }

    function getRevealTransform(el: Element) {
      if (el.hasAttribute("data-about-media")) {
        return "translateY(54px) scale(0.95) rotate(-2.5deg)";
      }

      const variant = (el as HTMLElement).dataset.revealGroup;
      if (variant === "copy") return "translateY(24px)";
      if (variant === "cards") return "translateY(46px) scale(0.96)";
      return "translateY(28px)";
    }

    function watchInView(
      el: Element,
      onReveal: () => void,
      options: {
        amount: number;
        margin: "0px 0px -10% 0px" | "0px 0px -12% 0px";
      },
    ) {
      let fallbackFrame = 0;
      let revealed = false;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) reveal();
        },
        { threshold: options.amount, rootMargin: options.margin },
      );

      const reveal = () => {
        if (revealed) return;
        revealed = true;
        stop();
        onReveal();
      };

      const check = () => {
        fallbackFrame = 0;
        if (isInRevealRange(el, options.amount, options.margin)) reveal();
      };

      const scheduleCheck = () => {
        if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
        fallbackFrame = requestAnimationFrame(check);
      };

      const poll = window.setInterval(check, 120);
      const pollTimeout = window.setTimeout(() => {
        window.clearInterval(poll);
      }, 1800);

      const stop = () => {
        observer.disconnect();
        window.clearInterval(poll);
        window.clearTimeout(pollTimeout);
        window.removeEventListener("scroll", scheduleCheck);
        window.removeEventListener("resize", scheduleCheck);
        if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
      };

      observer.observe(el);
      window.addEventListener("scroll", scheduleCheck, { passive: true });
      window.addEventListener("resize", scheduleCheck);
      scheduleCheck();

      return stop;
    }

    function isInRevealRange(el: Element, amount: number, margin: string) {
      const rect = el.getBoundingClientRect();
      if (rect.height <= 0 || rect.width <= 0) return false;

      const marginParts = margin.trim().split(/\s+/);
      const topMargin = marginParts[0] || "0px";
      const bottomMargin = marginParts[2] || marginParts[0] || "0px";
      const rootTop = -resolveRootMargin(topMargin, window.innerHeight);
      const rootBottom =
        window.innerHeight + resolveRootMargin(bottomMargin, window.innerHeight);
      const visibleHeight =
        Math.min(rect.bottom, rootBottom) - Math.max(rect.top, rootTop);

      return Math.max(0, visibleHeight) / rect.height >= amount;
    }

    function resolveRootMargin(value: string, size: number) {
      const numeric = Number.parseFloat(value);
      if (Number.isNaN(numeric)) return 0;
      return value.endsWith("%") ? (numeric / 100) * size : numeric;
    }

    function initReveals() {
      html.classList.add("reveal-ready");
      disposers.push(() => html.classList.remove("reveal-ready"));

      const revealEls = new WeakSet<Element>();
      const packageGroups = new WeakSet<HTMLElement>();
      const revealGroups = new WeakSet<Element>();
      const aboutMediaGroups = new WeakSet<Element>();

      const watchReveal = (el: Element) => {
        if (revealEls.has(el)) return;
        revealEls.add(el);

        const stop = armReveal(
          el,
          () => {
            markRevealed(el);
          },
          { amount: 0.18, margin: "0px 0px -10% 0px" },
        );
        disposers.push(stop);
      };

      const watchPackageGroup = (group: HTMLElement) => {
        if (packageGroups.has(group)) return;
        packageGroups.add(group);
        group.classList.add("package-cards-ready");

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            group.classList.add("is-visible");
            observer.disconnect();
          },
          { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
        );

        observer.observe(group);
        disposers.push(() => {
          observer.disconnect();
          group.classList.remove("package-cards-ready", "is-visible");
        });
      };

      const watchRevealGroup = (group: Element) => {
        if (revealGroups.has(group)) return;
        revealGroups.add(group);

        const variant = (group as HTMLElement).dataset.revealGroup;
        if (variant === "package-cards") return;

        const stop = armReveal(
          group,
          () => {
            markRevealed(group);
          },
          { amount: 0.14, margin: "0px 0px -10% 0px" },
        );
        disposers.push(stop);
      };

      const watchAboutMedia = (group: Element) => {
        if (aboutMediaGroups.has(group)) return;
        aboutMediaGroups.add(group);

        const stop = armReveal(
          group,
          () => {
            markRevealed(group);
          },
          { amount: 0.2, margin: "0px 0px -12% 0px" },
        );
        disposers.push(stop);
      };

      const scan = () => {
        document.querySelectorAll("[data-reveal]").forEach(watchReveal);
        document
          .querySelectorAll<HTMLElement>('[data-reveal-group="package-cards"]')
          .forEach(watchPackageGroup);
        document
          .querySelectorAll("[data-reveal-group]")
          .forEach(watchRevealGroup);
        document
          .querySelectorAll("[data-about-media]")
          .forEach(watchAboutMedia);
      };

      let scanFrame = 0;
      const scheduleScan = () => {
        if (scanFrame) cancelAnimationFrame(scanFrame);
        scanFrame = requestAnimationFrame(() => {
          scanFrame = 0;
          scan();
        });
      };

      scan();
      const observer = new MutationObserver(scheduleScan);
      observer.observe(document.body, { childList: true, subtree: true });
      disposers.push(() => {
        observer.disconnect();
        if (scanFrame) cancelAnimationFrame(scanFrame);
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
      const heroCopy = document.querySelector<HTMLElement>(".hero-copy");
      const aboutImage = document.getElementById("aboutImage");
      const experienceImage = document.getElementById("experienceImage");
      const contactImage = document.getElementById("contactImage");

      if (hero) {
        disposers.push(
          scroll(
            (progress: number) => {
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
        const aboutTarget = aboutImage.closest(".about-composition");
        if (aboutTarget) {
          disposers.push(
            scroll(
              (progress: number) => {
                aboutImage.style.setProperty(
                  "translate",
                  `0 ${-progress * 9}%`,
                );
              },
              {
                target: aboutTarget,
                offset: ["start end", "end start"],
              },
            ),
          );
        }
      }

      if (experienceImage) {
        const experienceTarget = experienceImage.closest(
          ".experience-composition",
        );
        if (experienceTarget) {
          disposers.push(
            scroll(
              (progress: number) => {
                experienceImage.style.setProperty(
                  "translate",
                  `0 ${(progress - 0.5) * 11}%`,
                );
              },
              {
                target: experienceTarget,
                offset: ["start end", "end start"],
              },
            ),
          );
        }
      }

      if (contactImage) {
        const contactTarget = document.querySelector(".contact");
        if (contactTarget) {
          disposers.push(
            scroll(
              (progress: number) => {
                contactImage.style.setProperty(
                  "translate",
                  `0 ${(progress - 0.5) * 8}%`,
                );
              },
              {
                target: contactTarget,
                offset: ["start end", "end start"],
              },
            ),
          );
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      disposers.forEach((dispose) => dispose());
    };
  }, [pathname]);

  return null;
}
