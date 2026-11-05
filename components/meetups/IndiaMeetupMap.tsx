"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { geoContains, geoMercator, geoPath, type GeoProjection } from "d3-geo";
import { feature, merge } from "topojson-client";
import type { Feature, FeatureCollection, Geometry, MultiPolygon } from "geojson";
import type {
  GeometryCollection,
  MultiPolygon as TopoMultiPolygon,
  Polygon as TopoPolygon,
  Topology,
} from "topojson-specification";
import { ArrowLeft, Loader2 } from "lucide-react";
import MeetupCard from "@/components/meetups/MeetupCard";
import { newestFirst, placeKey, stateKey, type MeetupPin } from "@/lib/meetups";

// ─────────────────────────────────────────────────────────────────────────────
// India, then one state. Two levels on purpose: past a state the districts
// are context, not destinations — nobody needs to zoom into Agra district to
// find the one pin in it.
//
// The geography is SVG in a fixed 1000-wide coordinate space. The pins, the
// labels and the hover card are HTML laid over it at the same percentages,
// which is what keeps a pin 30 px tall at every zoom and on every screen
// while the land underneath scales.
// ─────────────────────────────────────────────────────────────────────────────

const W = 1000;
/** India in Mercator is ~1.13 times taller than wide; this leaves a margin of sea. */
const H = 1120;
const PAD = 26;

/** A state never zooms past this, so Delhi fills the frame without becoming a blur. */
const MAX_ZOOM = 14;
/** Two pins closer than this, on screen, share one marker. */
const CLUSTER_PX = 36;

const EASE = [0.65, 0, 0.35, 1] as const;

const INK = "#002820";
const CREAM = "#f9fbe5";

/** The slab's side, a shade under the darkest land, and its bottom edge. */
const WALL = "#2a5d50";
const WALL_EDGE = "#173f35";
/** Where a lifted state came out of the slab. */
const CAVITY = "#1f4a3f";
/** The rest of India while one state is lifted out. */
const PALE = "#dde7cd";
const FEATHER_MASK =
  "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent), linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)";
const FEATHER: React.CSSProperties = {
  maskImage: FEATHER_MASK,
  WebkitMaskImage: FEATHER_MASK,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

/** Screen-pixel steps that stack into the slab's wall: ~11 px thick. */
const WALL_STEPS = [2, 4, 6, 8, 10, 11];
/** How far a chosen state rises out of the slab, and its own wall. */
const LIFT = 8;
const LIFT_WALL = [2, 4, 6, 8];

/** Land colour by how many meetups a state has had. Three flat steps read as a
 *  choropleth without a gradient key to decode. */
export function landFill(count: number): string {
  if (count >= 10) return "#4f8a7a";
  if (count >= 3) return "#7ea898";
  if (count >= 1) return "#a9c6b5";
  return "#e4ebce";
}

type StateShape = {
  key: string;
  name: string;
  d: string;
  bounds: [[number, number], [number, number]];
};

type DistrictShape = {
  id: string;
  name: string;
  d: string;
  feature: Feature<Geometry, { name: string; state: string }>;
};

type City = {
  id: string;
  name: string;
  stateKey: string;
  stateName: string;
  x: number;
  y: number;
  pins: MeetupPin[];
};

type Cluster = {
  id: string;
  x: number;
  y: number;
  cities: City[];
  pins: MeetupPin[];
};

/** Where the camera is: a point in projected space, and how far in. */
type View = { cx: number; cy: number; k: number };

const HOME: View = { cx: W / 2, cy: H / 2, k: 1 };

function toScreen(v: View, x: number, y: number): [number, number] {
  return [W / 2 + v.k * (x - v.cx), H / 2 + v.k * (y - v.cy)];
}

function viewFor(bounds: [[number, number], [number, number]]): View {
  const [[x0, y0], [x1, y1]] = bounds;
  const k = Math.min(MAX_ZOOM, 0.84 * Math.min(W / Math.max(x1 - x0, 1), H / Math.max(y1 - y0, 1)));
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, k: Math.max(1, k) };
}

/**
 * Greedy, biggest city first: each city joins the first marker within reach
 * or starts its own. The biggest city anchors the marker, so "Agra +2" sits
 * on Agra rather than on an average of three towns that is none of them.
 */
function cluster(cities: City[], radius: number): Cluster[] {
  const sorted = [...cities].sort((a, b) => b.pins.length - a.pins.length || a.name.localeCompare(b.name));
  const out: Cluster[] = [];
  for (const c of sorted) {
    const hit = out.find((g) => Math.hypot(g.x - c.x, g.y - c.y) <= radius);
    if (hit) {
      hit.cities.push(c);
      hit.pins.push(...c.pins);
    } else {
      out.push({ id: c.id, x: c.x, y: c.y, cities: [c], pins: [...c.pins] });
    }
  }
  for (const g of out) {
    g.pins.sort(newestFirst);
    g.id = g.cities.map((c) => c.id).join("+");
  }
  return out;
}

/**
 * "Agra", "Agra +1" — or, once a marker swallows several towns of one state
 * (all of Uttar Pradesh is one marker on a phone), the state: "Agra +13"
 * would credit Agra with Kanpur's meetups. Only at India scale: zoomed into
 * the state, naming the marker after the state says nothing.
 */
function clusterTitle(g: Cluster, wholeIndia: boolean): string {
  const [first, ...rest] = g.cities;
  if (wholeIndia && rest.length >= 2 && rest.every((c) => c.stateKey === first.stateKey)) return first.stateName;
  return rest.length ? `${first.name} +${rest.length}` : first.name;
}

/** Fetches a TopoJSON file once per page load, however many maps ask. */
const topoCache = new Map<string, Promise<Topology>>();
function loadTopo(url: string): Promise<Topology> {
  let p = topoCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<Topology>;
    });
    p.catch(() => topoCache.delete(url));
    topoCache.set(url, p);
  }
  return p;
}

export type Spotlight = { key: string; nonce: number } | null;

export default function IndiaMeetupMap({
  pins,
  focus,
  onFocus,
  highlight,
  spotlight,
  className = "",
}: {
  pins: MeetupPin[];
  /** stateKey of the state in view, or null for all of India. */
  focus: string | null;
  onFocus: (key: string | null) => void;
  /** A meetup key whose marker should lift — the list beside the map hovering it. */
  highlight?: string | null;
  /** Open this meetup's card, zooming to its state first if need be. */
  spotlight?: Spotlight;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);

  const [statesTopo, setStatesTopo] = useState<Topology | null>(null);
  const [districtsTopo, setDistrictsTopo] = useState<Topology | null>(null);
  const [failed, setFailed] = useState(false);

  const [view, setView] = useState<View>(HOME);
  const [moving, setMoving] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  const [hoverState, setHoverState] = useState<string | null>(null);
  const [hoverDistrict, setHoverDistrict] = useState<string | null>(null);

  const [open, setOpen] = useState<{ id: string; sticky: boolean } | null>(null);
  const [page, setPage] = useState(0);
  const closeTimer = useRef<number | undefined>(undefined);
  const pendingOpen = useRef<string | null>(null);

  // ─── Data ──────────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    loadTopo("/geo/india-states.json")
      .then((t) => alive && setStatesTopo(t))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  // Districts are only ever seen one state at a time, so they wait for the
  // first zoom rather than weighing down the India view.
  useEffect(() => {
    if (!focus || districtsTopo) return;
    let alive = true;
    loadTopo("/geo/india-districts.json")
      .then((t) => alive && setDistrictsTopo(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [focus, districtsTopo]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // Measured once now as well: ResizeObserver reports during a rendering
    // frame, and a tab opened in the background gets none — the pins would
    // wait for a width that never came.
    setStageW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setStageW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Geometry, projected once ──────────────────────────────────────

  const geo = useMemo(() => {
    if (!statesTopo) return null;
    const obj = statesTopo.objects.states as GeometryCollection<{ name: string }>;
    const fc = feature(statesTopo, obj) as FeatureCollection<Geometry, { name: string }>;
    const projection: GeoProjection = geoMercator().fitExtent(
      [
        [PAD, PAD],
        [W - PAD, H - PAD],
      ],
      fc,
    );
    const path = geoPath(projection);
    const states: StateShape[] = fc.features.map((f) => ({
      key: stateKey(f.properties.name),
      name: f.properties.name,
      d: path(f) ?? "",
      bounds: path.bounds(f),
    }));
    // Every state is a polygon or multipolygon; the file has nothing else.
    const polys = obj.geometries.filter(
      (g): g is TopoPolygon<{ name: string }> | TopoMultiPolygon<{ name: string }> =>
        g.type === "Polygon" || g.type === "MultiPolygon",
    );
    const outline = path(merge(statesTopo, polys) as MultiPolygon) ?? "";
    return { projection, path, states, outline };
  }, [statesTopo]);

  const districtsByState = useMemo(() => {
    if (!districtsTopo || !geo) return null;
    const fc = feature(
      districtsTopo,
      districtsTopo.objects.districts as GeometryCollection<{ name: string; state: string }>,
    ) as FeatureCollection<Geometry, { name: string; state: string }>;
    const out = new Map<string, DistrictShape[]>();
    fc.features.forEach((f, i) => {
      const k = stateKey(f.properties.state || "");
      const list = out.get(k) ?? [];
      list.push({ id: `${k}-${i}`, name: f.properties.name, d: geo.path(f) ?? "", feature: f });
      out.set(k, list);
    });
    return out;
  }, [districtsTopo, geo]);

  const countByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pins) m.set(stateKey(p.state), (m.get(stateKey(p.state)) ?? 0) + 1);
    return m;
  }, [pins]);

  const cities = useMemo<City[]>(() => {
    if (!geo) return [];
    const groups = new Map<string, MeetupPin[]>();
    for (const p of pins) {
      const id = `${stateKey(p.state)}|${placeKey(p.city || p.district || p.venue)}`;
      const list = groups.get(id) ?? [];
      list.push(p);
      groups.set(id, list);
    }
    return [...groups.entries()].flatMap(([id, list]) => {
      const lon = list.reduce((s, p) => s + p.lon, 0) / list.length;
      const lat = list.reduce((s, p) => s + p.lat, 0) / list.length;
      const xy = geo.projection([lon, lat]);
      if (!xy) return [];
      const first = list[0];
      return [
        {
          id,
          name: first.city || first.district || first.venue,
          stateKey: stateKey(first.state),
          stateName: first.state,
          x: xy[0],
          y: xy[1],
          pins: list,
        },
      ];
    });
  }, [pins, geo]);

  const focusShape = useMemo(() => geo?.states.find((s) => s.key === focus) ?? null, [geo, focus]);
  const target = useMemo<View>(() => (focusShape ? viewFor(focusShape.bounds) : HOME), [focusShape]);

  /** Markers for where the camera is going, not where it is mid-flight —
   *  otherwise they would merge and split a dozen times per zoom. */
  const clusters = useMemo(() => {
    if (!stageW) return [];
    const unitsPerPx = W / stageW;
    const visible = focus ? cities.filter((c) => c.stateKey === focus) : cities;
    return cluster(visible, (CLUSTER_PX * unitsPerPx) / target.k);
  }, [cities, focus, stageW, target.k]);

  const newestKey = useMemo(() => [...pins].sort(newestFirst)[0]?.key, [pins]);

  const focusDistricts = useMemo(() => {
    if (!focus || !districtsByState) return [];
    const inState = pins.filter((p) => stateKey(p.state) === focus);
    return (districtsByState.get(focus) ?? []).map((d) => ({
      ...d,
      hasMeetup: inState.some((p) => geoContains(d.feature, [p.lon, p.lat])),
    }));
  }, [focus, districtsByState, pins]);

  // ─── Camera ────────────────────────────────────────────────────────

  useEffect(() => {
    const from = viewRef.current;
    const to = target;
    if (from.cx === to.cx && from.cy === to.cy && from.k === to.k) return;
    setMoving(true);
    // Centre glides, scale moves geometrically: 1→14 then feels like the
    // same speed all the way in, instead of rushing the last few steps.
    const controls = animate(0, 1, {
      duration: reduce ? 0 : 0.95,
      ease: EASE,
      onUpdate: (t) =>
        setView({
          cx: from.cx + (to.cx - from.cx) * t,
          cy: from.cy + (to.cy - from.cy) * t,
          k: from.k * Math.pow(to.k / from.k, t),
        }),
      onComplete: () => {
        setView(to);
        setMoving(false);
      },
    });
    return () => controls.stop();
  }, [target, reduce]);

  // A card belongs to the view it was opened in.
  useEffect(() => {
    setOpen(null);
    setHoverDistrict(null);
  }, [focus]);

  // ─── Card behaviour ────────────────────────────────────────────────

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen((o) => (o?.sticky ? o : null)), 220);
  };

  const openRef = useRef(open);
  openRef.current = open;

  /** Re-hovering the open marker keeps its page; anything else starts at the newest. */
  const openCluster = useCallback((id: string, sticky: boolean, index = 0) => {
    cancelClose();
    const o = openRef.current;
    if (o?.id !== id || index !== 0) setPage(index);
    setOpen({ id, sticky: sticky || (o?.id === id && o.sticky) });
  }, []);

  // The list beside the map asks for a meetup by key.
  useEffect(() => {
    if (!spotlight) return;
    const pin = pins.find((p) => p.key === spotlight.key);
    if (!pin) return;
    pendingOpen.current = pin.key;
    if (stateKey(pin.state) !== focus) onFocus(stateKey(pin.state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlight]);

  useEffect(() => {
    const key = pendingOpen.current;
    if (!key || moving) return;
    const g = clusters.find((c) => c.pins.some((p) => p.key === key));
    if (!g) return;
    pendingOpen.current = null;
    openCluster(g.id, true, g.pins.findIndex((p) => p.key === key));
  }, [clusters, moving, openCluster, spotlight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open) setOpen(null);
      else if (focus) onFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, focus, onFocus]);

  // ─── Render ────────────────────────────────────────────────────────

  const transform = `translate(${W / 2 - view.k * view.cx} ${H / 2 - view.k * view.cy}) scale(${view.k})`;
  /** Screen pixels as map units at the current zoom. */
  const px = (n: number) => (n * (stageW ? W / stageW : 1)) / view.k;
  /** The state is out of the slab: zoomed in and the camera at rest. */
  const raised = !!focus && !!focusShape && !moving;
  /** Pins, labels and the card ride up with the lifted state. */
  const rise = focus ? LIFT : 0;
  const activeCluster = open ? clusters.find((c) => c.id === open.id) ?? null : null;
  const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

  const chip = (() => {
    // The page's caption already names the state in view, so zoomed in the
    // chip only speaks up for the district under the mouse.
    if (focus && focusShape) {
      return hoverDistrict ? { title: hoverDistrict, sub: `District in ${focusShape.name}` } : null;
    }
    if (hoverState) {
      const s = geo?.states.find((x) => x.key === hoverState);
      const n = countByState.get(hoverState) ?? 0;
      return { title: s?.name ?? "", sub: n ? `${n} meetup${n === 1 ? "" : "s"} · click to zoom in` : "No meetups yet · click to look" };
    }
    return null;
  })();

  return (
    <div
      ref={stageRef}
      // No box and no sea of its own: the page section is the sea, so India
      // sits in open water rather than in a framed chart.
      className={`kz-font relative select-none text-[#002820] ${className}`}
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      {geo && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          // Zoomed in, the neighbouring states run off the edge of the map;
          // feathered, they sink into the sea instead of stopping at a hard
          // rectangle. At India scale the country fits, so nothing is masked.
          style={view.k > 1.25 ? FEATHER : undefined}
          aria-hidden="true"
          onClick={() => {
            // Open sea: put the card away, then step back out to India.
            if (open) setOpen(null);
            else if (focus) onFocus(null);
          }}
        >
          <defs>
            {focusShape && (
              <clipPath id="kz-focus-clip">
                <path d={focusShape.d} />
              </clipPath>
            )}
          </defs>

          <g transform={transform}>
            {/* India as a slab of card on the sea: a flat shadow on the water,
                then the country stacked on itself a step lower each time to
                build the side wall. Every offset is in screen pixels, so the
                slab keeps its thickness at any zoom. */}
            <path d={geo.outline} fill={INK} opacity={0.15} transform={`translate(${px(16)} ${px(20)})`} />
            {WALL_STEPS.map((o, i) => (
              <path
                key={o}
                d={geo.outline}
                fill={i === WALL_STEPS.length - 1 ? WALL_EDGE : WALL}
                transform={`translate(0 ${px(o)})`}
              />
            ))}

            {geo.states.map((s) => {
              const n = countByState.get(s.key) ?? 0;
              const isFocus = s.key === focus;
              const hot = !focus && hoverState === s.key;
              // Zoomed in, the rest of India goes pale so the state reads;
              // once the state has lifted out, its place in the slab is a hole.
              const fill = isFocus ? (raised ? CAVITY : CREAM) : focus ? PALE : hot ? "#006255" : landFill(n);
              return (
                <path
                  key={s.key}
                  d={s.d}
                  fill={fill}
                  stroke={CREAM}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className="cursor-pointer transition-[fill,opacity] duration-300"
                  // Mouse only: a tap is a click, and a "hover" left behind by
                  // a finger would pin the chip to whatever was touched last.
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHoverState(s.key)}
                  onPointerLeave={() => setHoverState((h) => (h === s.key ? null : h))}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(null);
                    if (!isFocus) onFocus(s.key);
                  }}
                />
              );
            })}

            <path
              d={geo.outline}
              fill="none"
              stroke={INK}
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              pointerEvents="none"
            />

            {/* The chosen state, lifted out of the slab once the camera
                settles: its own wall and shadow under it, its districts on
                top. The lift is a CSS animation from 0 to the resting offset. */}
            {raised && focusShape && (
              <g className="kz-lift" style={{ transform: `translateY(${-px(LIFT)}px)` }}>
                <path d={focusShape.d} fill={INK} opacity={0.2} transform={`translate(${px(8)} ${px(LIFT + 10)})`} />
                {LIFT_WALL.map((o) => (
                  <path key={o} d={focusShape.d} fill={WALL} transform={`translate(0 ${px(o)})`} />
                ))}
                <path d={focusShape.d} fill={CREAM} />
                <g clipPath="url(#kz-focus-clip)">
                {focusDistricts.map((d) => (
                  <path
                    key={d.id}
                    d={d.d}
                    fill={hoverDistrict === d.name ? "#c8dccf" : d.hasMeetup ? "#dcebd8" : "transparent"}
                    stroke={INK}
                    strokeOpacity={0.22}
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                    className="transition-[fill] duration-200"
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHoverDistrict(d.name)}
                    onPointerLeave={() => setHoverDistrict((h) => (h === d.name ? null : h))}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(null);
                    }}
                  />
                ))}
                </g>
                <path d={focusShape.d} fill="none" stroke={INK} strokeWidth={2.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </g>
            )}
          </g>
        </svg>
      )}

      {/* ─── Markers, labels and the card: HTML over the SVG ─── */}
      <div className="pointer-events-none absolute inset-0">
        {/* The drop-in is a CSS animation, not framer-motion, for the reason
            app/template.tsx gives: a JS `initial={{ opacity: 0 }}` leaves the
            pins invisible whenever animation frames do not arrive (a tab
            opened in the background). A CSS one only plays them in. Keyed by
            view, so zooming drops in the new set. */}
        {geo &&
          clusters.map((g, i) => {
            const [x, y] = toScreen(view, g.x, g.y);
            const count = g.pins.length;
            const size = count >= 5 ? 34 : count >= 2 ? 29 : 24;
            const isOpen = open?.id === g.id;
            const lifted = isOpen || (highlight != null && g.pins.some((p) => p.key === highlight));
            const isNewest = g.pins.some((p) => p.key === newestKey);
            return (
                <div
                  key={`${focus ?? "india"}:${g.id}`}
                  className="kz-pin-drop absolute"
                  style={{
                    ...pct(x, y),
                    zIndex: isOpen ? 30 : lifted ? 20 : 10,
                    marginTop: -rise,
                    ["--delay" as string]: `${0.35 + i * 0.012}s`,
                  }}
                >
                  <button
                    type="button"
                    aria-label={`${clusterTitle(g, !focus)}: ${count} meetup${count === 1 ? "" : "s"}`}
                    aria-expanded={isOpen}
                    className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-full outline-none"
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse" && !open?.sticky) openCluster(g.id, false);
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === "mouse") scheduleClose();
                    }}
                    onFocus={() => !open?.sticky && openCluster(g.id, false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (open?.id === g.id && open.sticky) setOpen(null);
                      else openCluster(g.id, true);
                    }}
                  >
                    <Pin size={size} count={count} active={isOpen} lifted={lifted} pulse={isNewest && !focus} />
                  </button>
                </div>
            );
          })}

        {/* Town names in the state view, in a layer of their own above every
            pin: inside each marker, the next marker in the DOM would paint
            over them. Beside the pin's head rather than under its tip, where
            they would land on the next town; ink on a cream halo stays
            legible where two do cross, which a solid pill does not. */}
        {focus && !moving && (
          <div className="kz-fade-in absolute inset-0 z-[35]">
            {clusters.map((g) => {
              const [x, y] = toScreen(view, g.x, g.y);
              const size = g.pins.length >= 5 ? 34 : g.pins.length >= 2 ? 29 : 24;
              return (
                <span key={g.id} className="absolute" style={{ ...pct(x, y), marginTop: -rise }}>
                  <span
                    className="absolute whitespace-nowrap text-[0.7rem] font-bold leading-none text-[#002820] [text-shadow:0_0_3px_#f9fbe5,0_0_3px_#f9fbe5,0_0_2px_#f9fbe5,0_0_1px_#f9fbe5]"
                    style={{
                      // Near the right edge the label goes on the left, or the map clips it.
                      ...(x / W > 0.8 ? { right: size / 2 + 4 } : { left: size / 2 + 4 }),
                      top: -(size * (32 / 24)) * 0.62,
                    }}
                  >
                    {clusterTitle(g, false)}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {activeCluster && !moving && stageW > 0 && (
            <CardSlot
              key={activeCluster.id}
              cluster={activeCluster}
              view={view}
              rise={rise}
              stageW={stageW}
              page={page}
              onPage={setPage}
              sticky={!!open?.sticky}
              onClose={() => setOpen(null)}
              onEnter={cancelClose}
              onLeave={() => !open?.sticky && scheduleClose()}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ─── Chrome ─── */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
        <div className="flex min-w-0 items-center gap-2">
          <AnimatePresence initial={false}>
            {focus && (
              <motion.button
                key="back"
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => onFocus(null)}
                className="pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#002820] px-3.5 py-2 text-[0.78rem] font-semibold text-[#f9fbe5] shadow-sm transition-colors hover:bg-[#006255]"
              >
                <ArrowLeft size={15} /> India
              </motion.button>
            )}
          </AnimatePresence>
          {chip && (
            <div className="min-w-0 rounded-2xl bg-[#f9fbe5]/95 px-3.5 py-2 shadow-sm">
              <p className="truncate text-[0.85rem] font-bold leading-tight">{chip.title}</p>
              <p className="truncate text-[0.7rem] font-semibold text-[#4b6660]">{chip.sub}</p>
            </div>
          )}
        </div>
      </div>

      {!focus && geo && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-2xl bg-[#f9fbe5]/95 px-3.5 py-2.5 shadow-sm sm:bottom-5 sm:left-5">
          <p className="kz-label mb-1.5 text-[0.56rem] text-[#4b6660]">Meetups per state</p>
          <div className="flex items-center gap-3 text-[0.68rem] font-semibold">
            {[
              ["1–2", 1],
              ["3–9", 3],
              ["10+", 10],
            ].map(([label, n]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px]" style={{ background: landFill(n as number) }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {!geo && (
        <div className="absolute inset-0 grid place-items-center">
          {failed ? (
            <p className="kz-body max-w-xs px-6 text-center text-[#4b6660]">
              The map could not load. Every meetup is still in the list.
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-[#4b6660]">
              <Loader2 size={16} className="animate-spin" /> Drawing India…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** The red map pin. A count replaces the dot when it stands for several meetups. */
function Pin({
  size,
  count,
  active,
  lifted,
  pulse,
}: {
  size: number;
  count: number;
  active: boolean;
  lifted: boolean;
  pulse: boolean;
}) {
  const h = size * (32 / 24);
  return (
    <span className="relative block" style={{ width: size, height: h }}>
      {/* The newest meetup in the house breathes, so the map has a "now". */}
      {pulse && (
        <span className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#c6011f] opacity-60 motion-safe:animate-ping" />
      )}
      <span
        className={`absolute bottom-0 left-1/2 h-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#002820]/30 blur-[1px] transition-all duration-300 ${
          lifted ? "w-4 opacity-60" : "w-3 opacity-100"
        }`}
      />
      <svg
        viewBox="0 0 24 32"
        width={size}
        height={h}
        className={`relative block origin-bottom drop-shadow-[0_2px_2px_rgba(0,40,32,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:scale-110 group-focus-visible:-translate-y-1 group-focus-visible:scale-110 ${
          lifted ? "-translate-y-1 scale-110" : ""
        }`}
      >
        <path
          d="M12 31.2s10.4-10 10.4-18.6a10.4 10.4 0 1 0-20.8 0C1.6 21.2 12 31.2 12 31.2z"
          fill={active ? INK : "#c6011f"}
          stroke="#fff"
          strokeWidth={1.8}
          className="transition-[fill] duration-200"
        />
        {count > 1 ? (
          <text x="12" y="16.6" textAnchor="middle" fontSize={count > 9 ? 9.5 : 11} fontWeight={800} fill="#fff" fontFamily="Montserrat, sans-serif">
            {count}
          </text>
        ) : (
          <circle cx="12" cy="12.6" r="3.8" fill={CREAM} />
        )}
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-full ring-[#002820] group-focus-visible:ring-2" />
    </span>
  );
}

/**
 * Places the card next to its pin: above it when there is room, below when
 * the pin is near the top, and slid sideways so it never leaves the map. On a
 * phone-width map there is no "next to" — the card docks along the bottom.
 */
function CardSlot({
  cluster: g,
  view,
  rise,
  stageW,
  page,
  onPage,
  sticky,
  onClose,
  onEnter,
  onLeave,
}: {
  cluster: Cluster;
  view: View;
  rise: number;
  stageW: number;
  page: number;
  onPage: (i: number) => void;
  sticky: boolean;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const stageH = stageW * (H / W);
  const [sx, sy] = toScreen(view, g.x, g.y);
  const px = (sx / W) * stageW;
  const py = (sy / H) * stageH - rise;

  const docked = stageW < 520;
  const cardW = Math.min(344, stageW - 24);
  // The card itself, its pager strip when there is more than one meetup, and
  // the line naming the towns when one marker covers several.
  const cardH = 176 + (g.pins.length > 1 ? 44 : 0) + (g.cities.length > 1 ? 30 : 0);
  const pinH = 44;

  let style: React.CSSProperties;
  if (docked) {
    style = { left: 12, right: 12, bottom: 12 };
  } else {
    const left = Math.min(Math.max(px - cardW / 2, 12), stageW - cardW - 12);
    const above = py - pinH - 10 - cardH > 12;
    style = { left, width: cardW, top: above ? py - pinH - 10 - cardH : py + 14 };
  }

  return (
    <motion.div
      className="pointer-events-auto absolute z-40"
      style={style}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={(e) => e.stopPropagation()}
    >
      {g.cities.length > 1 && (
        <p className="mb-1.5 inline-block rounded-full bg-[#002820] px-2.5 py-1 text-[0.65rem] font-bold text-[#f9fbe5]">
          {g.cities.map((c) => c.name).join(" · ")}
        </p>
      )}
      <MeetupCard
        meetups={g.pins}
        index={page}
        onIndex={onPage}
        onClose={sticky || docked ? onClose : undefined}
        className={docked ? "!w-full" : ""}
      />
    </motion.div>
  );
}
