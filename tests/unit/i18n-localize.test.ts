import { describe, expect, it } from "vitest";
import { isRtl, locales, rtlLocales } from "@/i18n/routing";
import { localeFields, tArray, tField } from "@/lib/data/localize";

describe("i18n routing", () => {
  it("ships all seven supported locales", () => {
    expect(locales).toEqual(["en", "ar", "hi", "kn", "te", "ur", "zh"]);
  });

  it("flags Arabic and Urdu as right-to-left", () => {
    expect(rtlLocales).toContain("ar");
    expect(rtlLocales).toContain("ur");
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("ur")).toBe(true);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("hi")).toBe(false);
  });
});

describe("translation fallback (localize)", () => {
  const translations = {
    ar: { title: "عنوان", inclusions: ["نقل من المطار"] },
  };

  it("returns the locale's fields, or {} for English / missing", () => {
    expect(localeFields(translations, "ar")).toEqual({
      title: "عنوان",
      inclusions: ["نقل من المطار"],
    });
    expect(localeFields(translations, "en")).toEqual({});
    expect(localeFields(translations, "hi")).toEqual({});
    expect(localeFields(null, "ar")).toEqual({});
  });

  it("tField returns the translation, or the base when missing/blank", () => {
    const fields = localeFields(translations, "ar");
    expect(tField(fields, "title", "Title")).toBe("عنوان");
    expect(tField(fields, "summary", "English summary")).toBe("English summary");
    expect(tField({ title: "   " }, "title", "Base")).toBe("Base");
  });

  it("tArray returns the translated array, or the base when missing/empty", () => {
    const fields = localeFields(translations, "ar");
    expect(tArray(fields, "inclusions", ["Airport transfer"])).toEqual([
      "نقل من المطار",
    ]);
    expect(tArray(fields, "missing", ["Daily breakfast"])).toEqual([
      "Daily breakfast",
    ]);
    expect(tArray({ inclusions: [] }, "inclusions", ["Base"])).toEqual(["Base"]);
  });
});
