import type { Metadata } from "next";
import CouncilPage from "@/components/pages/CouncilPage";

export const metadata: Metadata = {
  title: "House Council — Student Leadership Team",
  description:
    "Meet the Kaziranga House Council at IIT Madras BS Degree — Upper House Council, Lower House Council, and specialized teams in WebOps, Graphics, Content, PR, Multimedia, and Event Management.",
  alternates: { canonical: "/council" },
};

export default function Page() {
  return <CouncilPage />;
}
