import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link + next/navigation. Importing Link /
// redirect / usePathname / useRouter from here preserves the active locale.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
