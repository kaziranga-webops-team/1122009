import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect, useLayoutEffect, lazy, Suspense } from "react";
import BackgroundAudio from "@/components/BackgroundAudio";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { motion, AnimatePresence } from "framer-motion";

import GalleryPage from "@/pages/GalleryPage";
import EventsPage from "@/pages/EventsPage";
import CouncilPage from "@/pages/CouncilPage";
import StudyPage from "@/pages/StudyPage";
import TakPage from "@/pages/TakPage";
import Navbar from "@/components/Navbar";


const queryClient = new QueryClient();

// ─── Scroll to top on route change ────────────────────────────────────────────
function ScrollToTop({ pathname }: { pathname: string }) {
  useLayoutEffect(() => {
    if (sessionStorage.getItem("scrollTarget")) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}



// ─── Router ───────────────────────────────────────────────────────────────────
function Router() {
  const [location] = useLocation();

  // Strip query params so ?tab=meetups doesn't cause a full remount
  const pathname = location.split("?")[0];
  const showNavbar = !["/gallery", "/events", "/council"].includes(pathname) && !pathname.startsWith("/admin");

  return (
    <>
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
              <Navbar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transitionEnd: { transform: "none" }
          }}
          exit={{ 
            opacity: 0, 
            y: -20,
            transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
          }}
          transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
          className="w-full min-h-screen origin-top"
        >
          <ScrollToTop pathname={pathname} />
          <Switch location={location}>
            <Route path="/"        component={Home} />
            <Route path="/gallery" component={GalleryPage} />
            <Route path="/events"  component={EventsPage} />
            <Route path="/council" component={CouncilPage} />
            <Route path="/study"   component={StudyPage} />
            <Route path="/tak"     component={TakPage} />
            
            <Route                 component={NotFound} />
          </Switch>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ReactLenis root options={{ duration: 1.5, lerp: 0.06, smoothWheel: true }}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <BackgroundAudio />
          <Toaster />
        </ReactLenis>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
