import { NextResponse } from "next/server";
import { getStudyResources } from "@/lib/content";

export const revalidate = 300;

/** Before the study_resources table exists, this is simply an empty list. */
export async function GET() {
  try {
    return NextResponse.json(await getStudyResources());
  } catch {
    return NextResponse.json([]);
  }
}
