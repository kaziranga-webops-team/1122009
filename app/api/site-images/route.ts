import { NextResponse } from "next/server";
import { getSiteImages } from "@/lib/content";

export const revalidate = 300;

/** An empty list until the table exists; pages then keep their built-in art. */
export async function GET() {
  try {
    return NextResponse.json(await getSiteImages());
  } catch {
    return NextResponse.json([]);
  }
}
