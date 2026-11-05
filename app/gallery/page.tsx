import type { Metadata } from "next";
import { Suspense } from "react";
import GalleryPage from "@/components/pages/GalleryPage";

export const metadata: Metadata = {
  title: "Meetups & Gallery — Photos, Memes & Memories",
  description:
    "Explore the Kaziranga House gallery — meetup photos, memes, stickers, and creative content from IIT Madras BS Degree students across India.",
  alternates: { canonical: "/gallery" },
};

export default function Page() {
  // GalleryPage reads the ?tab= search param, so it needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <GalleryPage />
    </Suspense>
  );
}
