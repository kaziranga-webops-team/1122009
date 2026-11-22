import type { Metadata } from "next";
import ResourcesPage from "@/components/study/ResourcesPage";

export const metadata: Metadata = {
  title: "Notes and study material",
  description: "Notes, cheat sheets and links shared by students for every IIT Madras BS subject, sorted by level.",
  alternates: { canonical: "/resources" },
};

export default function Page() {
  return <ResourcesPage />;
}
