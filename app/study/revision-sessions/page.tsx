import type { Metadata } from "next";
import RevisionSessions from "@/components/study/hub/RevisionSessions";
import { ToolPageShell } from "@/components/study/hub/HubShell";

export const metadata: Metadata = {
  title: "Revision sessions",
  description: "Kaziranga House revision sessions for IIT Madras BS quizzes, OPPEs and end terms: upcoming sessions and every recording.",
  alternates: { canonical: "/study/revision-sessions" },
};

export default function Page() {
  return (
    <ToolPageShell slug="revision-sessions" description="Upcoming sessions to join, then every recording. Filter by degree and exam.">
      <RevisionSessions bare />
    </ToolPageShell>
  );
}
