import type { Metadata } from "next";
import EventsPage from "@/components/pages/EventsPage";

export const metadata: Metadata = {
  title: "Events — Guest Sessions, Aarohan & Curiosity Hour",
  description:
    "Browse all Kaziranga House events — guest sessions, Aarohan culturals, technicals, e-sports competitions, and curiosity hours at IIT Madras BS Degree.",
  alternates: { canonical: "/events" },
};

export default function Page() {
  return <EventsPage />;
}
