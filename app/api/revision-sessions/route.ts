import { NextResponse } from "next/server";
import { getRevisionSessions } from "@/lib/content";

export const revalidate = 300;

export async function GET() {
  try {
    return NextResponse.json(await getRevisionSessions());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
