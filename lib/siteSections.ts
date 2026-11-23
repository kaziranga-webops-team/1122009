"use client";

import { useEffect, useState } from "react";
import { SITE_PAGES } from "@/lib/siteSectionsList";

let loaded: Promise<Set<string>> | null = null;

function load(): Promise<Set<string>> {
  loaded ??= fetch("/api/site-sections")
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: { section: string; visible: boolean }[]) => new Set((Array.isArray(rows) ? rows : []).filter((r) => !r.visible).map((r) => r.section)))
    .catch(() => new Set<string>());
  return loaded;
}

/** The sections and pages switched off in the portal. Everything shows until this loads. */
export function useHiddenSections(): Set<string> {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    void load().then((h) => alive && setHidden(h));
    return () => {
      alive = false;
    };
  }, []);
  return hidden;
}

/** Is the page at this path switched off? */
export function isPageHidden(hidden: Set<string>, path: string): boolean {
  return SITE_PAGES.some((p) => hidden.has(p.name) && (path === p.path || path.startsWith(p.path + "/")));
}
