import type { Metadata } from "next";
import GradePredictor from "@/components/study/hub/GradePredictor";
import { ToolPageShell } from "@/components/study/hub/HubShell";

export const metadata: Metadata = {
  title: "Grade predictor",
  description: "Find the end-term score you need for each grade in your IIT Madras BS course.",
  alternates: { canonical: "/study/grade-predictor" },
};

export default function Page() {
  return (
    <ToolPageShell slug="grade-predictor" description="Pick your course to see the end-term score you need for each grade.">
      <GradePredictor />
    </ToolPageShell>
  );
}
