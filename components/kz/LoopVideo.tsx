"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Props = {
  src: string;
  poster: string;
  /** object-position for both the poster and the loop, e.g. "45% 50%". */
  position?: string;
  className?: string;
};

/**
 * A muted, looping background clip that paints its poster first.
 *
 * Two things this handles that a bare <video loop autoPlay> does not:
 * Chromium pauses a muted background loop on a buffering hiccup, and there are
 * no controls to restart it — so any pause while the clip is on screen is
 * resumed. Off screen it is paused on purpose, to stop it decoding frames
 * nobody is looking at.
 */
export default function LoopVideo({ src, poster, position = "50% 50%", className = "" }: Props) {
  const reduce = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let onScreen = true;
    const resume = () => {
      if (onScreen) v.play().catch(() => {});
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) resume();
      else v.pause();
    });
    io.observe(v);
    v.addEventListener("pause", resume);
    return () => {
      io.disconnect();
      v.removeEventListener("pause", resume);
    };
  }, [src]);

  return (
    <div aria-hidden="true" className={`absolute inset-0 -z-10 ${className}`}>
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${poster})`, backgroundPosition: position }}
      />
      {!reduce && (
        <video
          ref={video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          onPlaying={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ objectPosition: position, opacity: playing ? 1 : 0 }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
