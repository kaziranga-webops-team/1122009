import type { Metadata } from "next";
import TakPage from "@/components/pages/TakPage";

export const metadata: Metadata = {
  title: "Kaziranga Tak — Short Videos & Reels",
  description:
    "Watch short-form video reels, creative content, and behind-the-scenes moments from Kaziranga House members at IIT Madras BS Degree.",
  alternates: { canonical: "/tak" },
};

export default function Page() {
  return <TakPage />;
}
