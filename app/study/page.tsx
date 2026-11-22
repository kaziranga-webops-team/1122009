import type { Metadata } from "next";
import HubOverview from "@/components/study/hub/HubOverview";

export const metadata: Metadata = {
  title: "Study zone",
  description:
    "Student handbooks, grading documents, important links, grade predictor, GPA and CGPA calculator and study help for IIT Madras BS students.",
  alternates: { canonical: "/study" },
};

export default function Page() {
  return <HubOverview />;
}
