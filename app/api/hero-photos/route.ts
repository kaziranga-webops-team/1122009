import { NextResponse } from "next/server";

// Sample "students enjoying & engaging" photos, bundled locally in
// public/images/hero. Replace these files (or this list) with real house
// photos later — the hero showcase picks up whatever this route returns.
const PHOTOS = [
  "/images/hero/kazi-3.jpg",
  "/images/hero/kazi-4.jpg",
  "/images/hero/kazi-5.jpg",
  "/images/hero/kazi-6.jpg",
  "/images/hero/kazi-7.jpg",
];

// Shuffle on every request so the showcase feels new on each visit.
export const dynamic = "force-dynamic";

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET() {
  const photos = shuffle(PHOTOS).map((url, i) => ({
    url,
    // Last-resort fallback if a file is ever missing.
    fallback: `https://picsum.photos/seed/kaziranga-${i}/900/1100`,
  }));
  return NextResponse.json(photos);
}
