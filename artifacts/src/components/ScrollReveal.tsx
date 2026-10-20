import { useRef, useEffect, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number; // ms
  distance?: number; // px translate
  className?: string;
  once?: boolean;
}

/**
 * Smoothly fades + slides children into view when they enter the viewport.
 * Powered by GSAP ScrollTrigger.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  distance = 40,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset styles for GSAP
    gsap.set(el, {
      opacity: 0,
      y: distance,
    });

    const anim = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: delay / 1000,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: once ? "play none none none" : "play reverse play reverse",
        once: once,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [delay, distance, once]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
