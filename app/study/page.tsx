import type { Metadata } from "next";
import StudyPage from "@/components/pages/StudyPage";

export const metadata: Metadata = {
  title: "Study Zone — Academic Resources & Course Planner",
  description:
    "Access curated study resources, course planners, and the Discourse forum for IIT Madras BS Degree students. Covers both Data Science and Electronic Systems programmes.",
  alternates: { canonical: "/study" },
};

export default function Page() {
  return <StudyPage />;
}
