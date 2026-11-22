import type { Metadata } from "next";
import { ToolPageShell } from "@/components/study/hub/HubShell";
import { BooksBrowser } from "@/components/study/hub/SubjectBrowser";

export const metadata: Metadata = {
  title: "Recommended books",
  description: "Books and PDFs recommended for each IIT Madras BS subject.",
  alternates: { canonical: "/study/recommended-books" },
};

export default function Page() {
  return (
    <ToolPageShell
      slug="recommended-books"
      description="Textbooks and reference PDFs for going deeper. Pick your level, then find your subject."
    >
      <BooksBrowser />
    </ToolPageShell>
  );
}
