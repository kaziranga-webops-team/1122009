"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { AnimatePresence, motion } from "framer-motion";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import BackgroundAudio from "@/components/BackgroundAudio";

// Routes that render their own header, so the global Navbar is hidden.
const NAVBAR_HIDDEN = ["/gallery", "/events", "/council"];

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  const showNavbar =
    !NAVBAR_HIDDEN.includes(pathname) && !pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ReactLenis root options={{ duration: 1.5, lerp: 0.06, smoothWheel: true }}>
          <AnimatePresence>
            {showNavbar && (
              <motion.div
                key="global-navbar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[60] pointer-events-none"
              >
                <div className="pointer-events-auto">
                  {/* Navbar reads useSearchParams → needs a Suspense boundary */}
                  <Suspense fallback={null}>
                    <Navbar />
                  </Suspense>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {children}

          <BackgroundAudio />
          <Toaster />
        </ReactLenis>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
