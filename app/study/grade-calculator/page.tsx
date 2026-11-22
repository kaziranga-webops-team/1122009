import type { Metadata } from "next";
import GradeCalculator from "@/components/study/hub/GradeCalculator";
import { ToolPageShell } from "@/components/study/hub/HubShell";

export const metadata: Metadata = {
  title: "GPA and CGPA calculator",
  description: "Work out your term GPA and updated CGPA from your IIT Madras BS grades.",
  alternates: { canonical: "/study/grade-calculator" },
};

export default function Page() {
  return (
    <ToolPageShell slug="grade-calculator" description="Add your courses for a term GPA, or combine this term with your current CGPA.">
      <GradeCalculator />
    </ToolPageShell>
  );
}
