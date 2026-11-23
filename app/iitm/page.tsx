import type { Metadata } from "next";
import IitmCorner from "@/components/pages/IitmCorner";

export const metadata: Metadata = {
  title: "IITM corner",
  description: "Every official IIT Madras BS link in one place: student portal, OPPE and exams, hall tickets, rules, grievances, student life and placements.",
  alternates: { canonical: "/iitm" },
};

export default function Page() {
  return <IitmCorner />;
}
