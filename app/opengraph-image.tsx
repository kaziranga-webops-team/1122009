import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The picture shown when a link to the site is shared on WhatsApp, Instagram,
 * LinkedIn, X and so on: the home page's own hero, in the house colours.
 * Built once at deploy time.
 */
export const alt = "Kaziranga House: the student house of the IIT Madras BS degree";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#c8102e";
const MARIGOLD = "#f6b51e";
const CREAM = "#f5e9cf";
const INK = "#1c130c";

/** A Google font as a TrueType file, limited to the letters drawn. */
async function googleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const TAGLINE = "The student house of the IIT Madras BS degree";
  const SMALL = "Meetups · Events · Study zone · Council";

  const [display, body, logo] = await Promise.all([
    googleFont("Yatra+One", "Kaziranga House"),
    googleFont("Mukta:wght@600", `${SMALL}${TAGLINE}`),
    readFile(join(process.cwd(), "public", "logo.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`),
  ]);

  const fonts = [
    ...(display ? [{ name: "Yatra One", data: display, weight: 400 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Mukta", data: body, weight: 600 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: RED,
          // The woven cloth of the home page's hero.
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 6px)",
          padding: "52px 72px",
          fontFamily: "Yatra One",
        }}
      >
        {/* A marigold sun rising behind the title, at the right edge. */}
        <div
          style={{
            position: "absolute",
            right: -150,
            top: 150,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: MARIGOLD,
            opacity: 0.18,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -60,
            top: 240,
            width: 340,
            height: 340,
            borderRadius: 9999,
            border: `6px solid ${CREAM}`,
            opacity: 0.25,
            display: "flex",
          }}
        />

        {/* The house seal alone: the title below already names the house. */}
        <div style={{ display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={72} height={72} alt="" style={{ borderRadius: 9999 }} />
        </div>

        {/* The title, exactly as the home page sets it. */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 58 }}>
          <span style={{ fontSize: 172, lineHeight: 0.9, color: MARIGOLD, textShadow: `9px 9px 0 ${INK}` }}>Kaziranga</span>
          <span style={{ fontSize: 124, lineHeight: 1.05, color: CREAM, marginTop: 6 }}>House</span>
        </div>

        {/* What it is, along the bottom. */}
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Mukta",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 30, color: CREAM }}>{TAGLINE}</span>
          <span style={{ fontSize: 24, color: MARIGOLD }}>{SMALL}</span>
        </div>

        {/* A gamosa-style border along the foot. */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, display: "flex", background: CREAM }}>
          <div style={{ display: "flex", flex: 1, backgroundImage: `repeating-linear-gradient(90deg, ${RED} 0px, ${RED} 18px, transparent 18px, transparent 36px)`, margin: "4px 0" }} />
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
