import type { Metadata } from "next";
import MeetupsPage from "@/components/pages/MeetupsPage";

export const metadata: Metadata = {
  title: "Meetups — Kaziranga House across India",
  description:
    "Every Kaziranga House meetup on one map of India — from Agra and Kanpur to Bhubaneswar, Chennai and Jammu. Zoom into a state to see where members meet.",
  alternates: { canonical: "/meetups" },
};

export default function Page() {
  return <MeetupsPage />;
}
