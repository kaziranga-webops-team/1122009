import { NextResponse } from "next/server";
import { getEpisodes } from "@/lib/sheets";

export const revalidate = 300;

export async function GET() {
  try {
    return NextResponse.json(await getEpisodes());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
