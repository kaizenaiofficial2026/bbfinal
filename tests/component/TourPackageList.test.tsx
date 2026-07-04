import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";
import type { TourPackage } from "@/lib/data/types";

// The list links via the locale-aware Link and next/image; stub both so the
// component renders without an app-router/runtime image context.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

import TourPackageList from "@/components/TourPackageList";

const base: TourPackage = {
  id: "1",
  slug: "glamour-of-sri-lanka",
  title: "Glamour of Sri Lanka",
  tier: "Luxury",
  hotels: "5-star",
  destinations: "Colombo",
  duration: "4 days / 3 nights",
  image: "/x.jpg",
  heroImage: "/x.jpg",
  summary: "A polished city escape.",
  inclusions: [],
  itinerary: [],
  priceAmount: 499,
  depositAmount: 0,
  currency: "USD",
};

describe("TourPackageList pricing", () => {
  it("shows a formatted price on cards that have one", () => {
    render(<TourPackageList packages={[base]} />);
    expect(screen.getByText(/USD 499/)).toBeInTheDocument();
  });

  it("omits the price element when a package has no price", () => {
    render(
      <TourPackageList
        packages={[{ ...base, slug: "quote-only", priceAmount: null }]}
      />,
    );
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
  });

  it("renders a card per package plus the custom-quote card", () => {
    const { container } = render(
      <TourPackageList
        packages={[base, { ...base, slug: "second", title: "Second" }]}
      />,
    );
    // two package cards + one custom-quote card
    expect(container.querySelectorAll(".tour-package-card")).toHaveLength(3);
  });
});
