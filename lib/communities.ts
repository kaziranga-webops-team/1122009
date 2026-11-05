import type { LucideIcon } from "lucide-react";
import { Bot, Camera, Code2, Crown, FlaskConical, Gamepad2, MessagesSquare, Music, Palette, Shield, ShieldCheck, Sun, TrendingUp } from "lucide-react";

/**
 * The house's internal communities.
 *
 * Logos: drop each community's logo in /public/images/communities/ named
 * after its slug (e.g. binary-minds.png) and set `logo` below. Until a logo
 * is set, the community is shown as a stitched patch with its icon.
 *
 * `aliases` are the other spellings the events sheet uses for the same
 * community, so its events link back to it.
 */

export type CommunityGroup = "tech" | "stage" | "games" | "ideas";

export interface Community {
  slug: string;
  name: string;
  /** what it is about, in two or three words */
  focus: string;
  /** one plain sentence */
  line: string;
  group: CommunityGroup;
  Icon: LucideIcon;
  /** patch colour and the ink that sits on it */
  bg: string;
  ink: string;
  logo?: string;
  aliases?: string[];
}

export const GROUPS: { value: CommunityGroup; label: string }[] = [
  { value: "tech", label: "Tech & science" },
  { value: "stage", label: "Arts & stage" },
  { value: "games", label: "Games & strategy" },
  { value: "ideas", label: "Ideas & purpose" },
];

const CREAM = "#f9fbe5";
const INK = "#002820";

export const COMMUNITIES: Community[] = [
  { slug: "anveshan", name: "Anveshan", focus: "Science & research", line: "For the curious — papers, experiments and research conversations.", group: "tech", Icon: FlaskConical, bg: "#006255", ink: CREAM },
  { slug: "binary-minds", name: "Binary Minds", focus: "Technical", line: "Coding, building and the house's technical events.", group: "tech", Icon: Code2, bg: "#c6e3cf", ink: INK },
  { slug: "codest", name: "Codest", focus: "Cybersecurity", line: "Cybersecurity, from the basics to hacking challenges.", group: "tech", Icon: ShieldCheck, bg: "#00332a", ink: CREAM },
  { slug: "thunder", name: "Thunder", focus: "Electronics & robotics", line: "Circuits, sensors and robots you can actually build.", group: "tech", Icon: Bot, bg: "#ecd394", ink: INK },

  { slug: "rangmanch", name: "Rangmanch", focus: "Singing & dancing", line: "Singing, dancing and every stage the house puts up.", group: "stage", Icon: Music, bg: "#d4ebbe", ink: INK },
  { slug: "srijan", name: "Srijan", focus: "Art & craft", line: "Drawing, painting, craft and making things by hand.", group: "stage", Icon: Palette, bg: "#1f4d43", ink: CREAM },
  { slug: "snap-sphere", name: "Snap Sphere", focus: "Photography", line: "Photo walks, edits and contests like Photopia.", group: "stage", Icon: Camera, bg: "#96b4a5", ink: INK, aliases: ["Snap Spear"] },

  { slug: "avatar-esports", name: "Avatar Esports", focus: "Esports", line: "BGMI, Free Fire and the house's gaming squads.", group: "games", Icon: Gamepad2, bg: "#006255", ink: CREAM, aliases: ["Booyah Brigade", "Erangel Elite"] },
  { slug: "grandmasters-guild", name: "The Grandmasters Guild", focus: "Chess", line: "Chess, from first openings to tournament nights.", group: "games", Icon: Crown, bg: "#dcebd8", ink: INK, aliases: ["Grandmaster Guild", "Grandmasters Guild"] },

  { slug: "kaziranga-forum", name: "The Kaziranga Forum", focus: "Debate", line: "Debates and discussions — arguing it out, politely.", group: "ideas", Icon: MessagesSquare, bg: "#ecd394", ink: INK, aliases: ["Kazi Forum", "Kaziranga Forum"] },
  { slug: "kazi-street", name: "Kazi Street", focus: "Finance & business", line: "Markets, money and business analytics.", group: "ideas", Icon: TrendingUp, bg: "#00332a", ink: CREAM },
  { slug: "parakram", name: "Parakram", focus: "Defence", line: "For anyone drawn to the armed forces and national defence.", group: "ideas", Icon: Shield, bg: "#c6e3cf", ink: INK },
  { slug: "divine-quest", name: "Divine Quest", focus: "Spirituality", line: "Reflection, bhajans and conversations about the inner life.", group: "ideas", Icon: Sun, bg: "#1f4d43", ink: CREAM },
];

const norm = (s: string) => s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z]/g, "");

/** The community an events-sheet organiser name refers to, if any. */
export function findCommunity(name: string): Community | undefined {
  const n = norm(name);
  if (!n) return undefined;
  return COMMUNITIES.find((c) => norm(c.name) === n || c.aliases?.some((a) => norm(a) === n));
}

export const communityBySlug = (slug: string) => COMMUNITIES.find((c) => c.slug === slug);
