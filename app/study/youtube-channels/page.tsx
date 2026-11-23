import type { Metadata } from "next";
import { ToolPageShell } from "@/components/study/hub/HubShell";
import { YouTubeChannelsBrowser } from "@/components/study/hub/SubjectBrowser";

export const metadata: Metadata = {
  title: "YouTube channels",
  description: "The YouTube channel for each IIT Madras BS course, by level and subject.",
  alternates: { canonical: "/study/youtube-channels" },
};

export default function Page() {
  return (
    <ToolPageShell
      slug="youtube-channels"
      description="The YouTube channel for each course. Pick your level, then find your subject."
    >
      <YouTubeChannelsBrowser />
    </ToolPageShell>
  );
}
