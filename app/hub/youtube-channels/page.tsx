import type { Metadata } from "next";
import { ToolPageShell } from "@/components/study/hub/HubShell";
import { YouTubeChannelsBrowser } from "@/components/study/hub/SubjectBrowser";

export const metadata: Metadata = {
  title: "YouTube channels",
  description: "YouTube channels that explain each IIT Madras BS subject well.",
  alternates: { canonical: "/hub/youtube-channels" },
};

export default function Page() {
  return (
    <ToolPageShell
      slug="youtube-channels"
      description="Channels students recommend when a week's lectures don't click. Pick your level, then find your subject."
    >
      <YouTubeChannelsBrowser />
    </ToolPageShell>
  );
}
