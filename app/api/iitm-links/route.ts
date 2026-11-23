import { NextResponse } from "next/server";
import { getIitmLinks } from "@/lib/content";

export const revalidate = 300;

/** An empty list until the table exists; the site then uses the links built into the code. */
export async function GET() {
  try {
    return NextResponse.json(await getIitmLinks());
  } catch {
    return NextResponse.json([]);
  }
}
