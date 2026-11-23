import { NextResponse } from "next/server";
import { getCouncil } from "@/lib/content";

export const revalidate = 300;

/**
 * The council as the public site sees it, phone numbers included: members
 * reach their regional coordinator or community head straight from the site.
 * Leave a member's phone empty in the editor to keep it off the site.
 */
export async function GET() {
  try {
    return NextResponse.json(await getCouncil());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
