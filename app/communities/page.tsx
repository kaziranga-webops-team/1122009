import type { Metadata } from "next";
import CommunitiesPage from "@/components/pages/CommunitiesPage";

export const metadata: Metadata = {
  title: "Communities",
  description:
    "The communities inside Kaziranga House — science, coding, cybersecurity, robotics, music and dance, art, photography, esports, chess, debate, finance, defence and spirituality.",
  alternates: { canonical: "/communities" },
};

export default function Page() {
  return <CommunitiesPage />;
}
