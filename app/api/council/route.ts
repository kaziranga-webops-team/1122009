import { NextResponse } from "next/server";
import { getCouncil } from "@/lib/sheets";

export const revalidate = 300;

export async function GET() {
  try {
    return NextResponse.json(await getCouncil());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
