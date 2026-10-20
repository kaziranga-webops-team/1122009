import { useContent } from "@/hooks/useData";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const { data: content, isLoading, isError, error } = useContent();
  const hero = content?.hero;
  const site = content?.site;

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    if (isLoading) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Set initial values
    gsap.set([titleRef.current, subtitleRef.current, buttonRef.current], {
      opacity: 0,
    });
    gsap.set(titleRef.current, { y: 30 });
    gsap.set(subtitleRef.current, { y: 20 });
    gsap.set(buttonRef.current, { y: 15 });

    // Timeline execution
    tl.to(titleRef.current, { y: 0, opacity: 1, duration: 0.9, delay: 0.2 })
      .to(subtitleRef.current, { y: 0, opacity: 1, duration: 0.8 }, "-=0.55")
      .to(buttonRef.current, { y: 0, opacity: 1, duration: 0.8 }, "-=0.5");

    return () => {
      tl.kill();
    };
  }, [isLoading]);

  if (isError) {
    return (
      <section id="hero" className="min-h-screen flex items-center justify-center bg-background scroll-mt-20">
        <div className="max-w-lg mx-auto p-10 bg-red-50 rounded-3xl text-center border-2 border-red-200 shadow-xl">
          <div className="text-5xl mb-4">🦏</div>
          <h2 className="text-2xl font-bold text-red-800 mb-3">Oops — content.json has a problem</h2>
          <p className="text-red-600 text-sm font-mono bg-red-100 rounded-lg p-3 mb-3">
            {(error as Error)?.message}
          </p>
          <p className="text-red-500 text-sm">
            Open <code className="bg-red-100 px-1 rounded">public/data/content.json</code>, fix the JSON syntax, and save.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={heroRef} id="hero" className="sticky top-0 w-full min-h-[90vh] md:min-h-[100vh] overflow-hidden scroll-mt-20 z-0 bg-[#f5f0e1] flex flex-col justify-center">
      {/* Cream Color Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#fdfbf7] via-[#f5f0e1] to-[#e8dec5]" />

      {/* Hero content */}
      <div className="pt-32 md:pt-40 pb-20 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl text-left">

            <div ref={titleRef} className="hero-title-container opacity-0">
              <h1 className="text-2xl md:text-4xl lg:text-5xl text-left hero-title-main font-bold">
                {isLoading ? "Kaziranga House" : (hero?.title || "Kaziranga House")}
              </h1>
              <div className="hero-title-underline" />
            </div>

            <p ref={subtitleRef} className="hero-subtitle text-left opacity-0">
              {isLoading ? "Creators. Leaders. Dreamers. Together, we go Beyond Limits!" : (hero?.subtitle || site?.tagline || "Creators. Leaders. Dreamers. Together, we go Beyond Limits!")}
            </p>

            {/* Join Us Button */}
            <div ref={buttonRef} className="mt-6 flex justify-start opacity-0">
              <a
                href="https://forms.gle/Ac5Zxwn21cRMeEcy8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#1e5631] text-white text-sm font-medium hover:bg-[#153e22] transition-colors duration-200 shadow-sm"
              >
                <span>Join Us</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
