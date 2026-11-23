"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { AnimatePresence, motion } from "framer-motion";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/portal/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { PortalProviders } from "@/components/portal/layout/PortalProviders";
import { portalFontVars } from "@/lib/portal/fonts";
import PageOff from "@/components/kz/PageOff";
import { isPageHidden, useHiddenSections } from "@/lib/siteSections";

/** The portal's sections. They share one shell, mounted once while you move between them. */
const PORTAL_SHELL = ["/dashboard", "/admin", "/super-admin"];

// Routes that render their own header, so the global Navbar is hidden.
// "/" is the illustrated homepage — it ships its own KzHeader.
const NAVBAR_HIDDEN = ["/", "/gallery", "/events", "/council", "/meetups", "/communities", "/study", "/tak", "/iitm"];

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  const isPortalRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin") ||
    pathname === "/login" ||
    pathname === "/access-denied" ||
    pathname.startsWith("/team-invitation") ||
    pathname === "/my-registrations" ||
    pathname === "/notifications" ||
    pathname === "/profile";

  // A page switched off in the portal (Website → Sections) shows a short note instead.
  const hidden = useHiddenSections();
  const pageOff = isPageHidden(hidden, pathname);

  const inPortalShell = PORTAL_SHELL.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const showNavbar = !NAVBAR_HIDDEN.includes(pathname) && !pathname.startsWith("/study/") && !isPortalRoute;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            {/* Smooth scrolling is for the public site. Inside the portal it hijacked
                the wheel, so the sidebar and other inner lists would not scroll:
                anything under .ed-app scrolls natively, and nested scrollers
                elsewhere (modals, panels) keep their own scroll. */}
            <ReactLenis
              root
              options={{
                duration: 1.5,
                lerp: 0.06,
                smoothWheel: true,
                allowNestedScroll: true,
                prevent: (node) => node.classList?.contains("ed-app") ?? false,
              }}
            >
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

              {pageOff ? (
                <PageOff />
              ) : inPortalShell ? (
                <div className={`${portalFontVars} contents`}>
                  <PortalProviders>{children}</PortalProviders>
                </div>
              ) : (
                children
              )}
              <Toaster />
            </ReactLenis>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
