import { NextResponse } from "next/server";
import { getSiteSections } from "@/lib/content";

export const revalidate = 300;

/** An empty list until the table exists: then everything shows. */
export async function GET() {
  try {
    return NextResponse.json(await getSiteSections());
  } catch {
    return NextResponse.json([]);
  }
}
