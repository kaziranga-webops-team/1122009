import { useQuery } from "@tanstack/react-query";

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  instagram: string;
  github: string;
  footerNote: string;
  program: string;
  house: string;
};

export type HeroConfig = {
  title: string;
  subtitle: string;
  ctaText: string;
  image: string;
};

export type Reel = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  date: string;
  description: string;
};

export type TakSection = {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionImage: string;
  reels: Reel[];
};

export type EventWinner = {
  event: string;
  name: string;
};

export type KEvent = {
  id: string;
  title: string;
  status: "upcoming" | "ongoing" | "completed";
  date: string;
  description: string;
  participants: string[];
  winners: EventWinner[];
};

export type EventsSection = {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionImage: string;
  events: KEvent[];
};

export type BlogPost = {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
};

export type BlogsSection = {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionImage: string;
  posts: BlogPost[];
};

export type StudyMaterial = {
  id: string;
  title: string;
  type: string;
  url: string;
  uploadedBy: string;
  date: string;
};

export type StudySubject = {
  id: string;
  name: string;
  materials: StudyMaterial[];
};

export type StudyLevel = {
  id: string;
  name: string;
  subjects: StudySubject[];
};

export type StudyGroup = {
  id: string;
  name: string;
  levels: StudyLevel[];
};

export type StudySectionData = {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionImage: string;
  studyPortalUrl: string;
  groups: StudyGroup[];
};

export type ContentData = {
  site: SiteConfig;
  hero: HeroConfig;
  tak: TakSection;
  events: EventsSection;
  blogs: BlogsSection;
  study: StudySectionData;
};



export function useContent() {
  return useQuery<ContentData>({
    queryKey: ["content"],
    queryFn: async () => {
      // Fetch static JSON
      const res = await fetch("/data/content.json", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error(`Failed to load content.json (HTTP ${res.status})`);
      const data = await res.json() as ContentData;



      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
