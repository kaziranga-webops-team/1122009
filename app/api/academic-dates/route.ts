import { NextResponse } from "next/server";
import { getAcademicDates } from "@/lib/content";

export const revalidate = 300;

/** The academic calendar; an empty list until the table exists. */
export async function GET() {
  try {
    return NextResponse.json(await getAcademicDates());
  } catch {
    return NextResponse.json([]);
  }
}
