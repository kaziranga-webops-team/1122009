'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { ArrowLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { REGION_THEMES, regionImage } from '@/components/portal/home/RegionArt';
import { REGIONS, type Region } from '@/lib/portal/regions';

const SOFT = [0.22, 1, 0.36, 1] as const;
const HANDLE = 56;

function GoogleMark() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

/**
 * Slide to enter: the Google token runs along a rail like a gate. Sliding it
 * to the end signs you in; letting go early springs it back. The token is
 * also a button, so a tap, Enter or Space does the same thing.
 */
function SlideToEnter({ onEnter, busy }: { onEnter: () => void; busy: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const [max, setMax] = useState(0);
  const fill = useTransform(x, (v) => v + HANDLE);
  const hint = useTransform(x, [0, Math.max(max * 0.6, 1)], [1, 0]);

  useEffect(() => {
    const measure = () => setMax(Math.max((rail.current?.clientWidth ?? 0) - HANDLE - 8, 0));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // While signing in the token rests at the end; afterwards it comes home.
  useEffect(() => {
    animate(x, busy ? max : 0, reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 });
  }, [busy, max, reduce, x]);

  const release = () => {
    if (busy) return;
    if (x.get() >= max * 0.85) {
      animate(x, max, { duration: 0.15 });
      onEnter();
    } else {
      animate(x, 0, reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 30 });
    }
  };

  return (
    <div
      ref={rail}
      className="relative h-[4.5rem] w-full overflow-hidden rounded-full border-2 border-[#1c130c] bg-[#ebd9b2] p-1"
    >
      <motion.div aria-hidden="true" className="absolute inset-y-1 left-1 rounded-full bg-[#0f5e48]" style={{ width: fill }} />
      <motion.span
        aria-hidden="true"
        style={{ opacity: hint }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 pl-14 text-[1rem] font-semibold text-[#1c130c]"
      >
        <span className="sm:hidden">Slide to sign in</span>
        <span className="hidden sm:inline">Slide to sign in with Google</span>
        <ChevronsRight size={18} className="shrink-0 animate-pulse" />
      </motion.span>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center pr-14 text-[1rem] font-semibold text-[#f5e9cf]">
          Opening Google…
        </span>
      )}
      <motion.button
        type="button"
        drag={busy ? false : 'x'}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={release}
        onClick={() => !busy && x.get() < 4 && onEnter()}
        style={{ x, width: HANDLE, height: HANDLE }}
        disabled={busy}
        aria-label="Sign in with Google"
        className="kz-focus relative z-10 grid cursor-grab place-items-center rounded-full bg-white shadow-[0_6px_14px_-6px_rgba(28,19,12,0.6)] active:cursor-grabbing disabled:cursor-wait"
      >
        {busy ? <Loader2 size={22} className="animate-spin text-[#0f5e48]" /> : <GoogleMark />}
      </motion.button>
    </div>
  );
}

/** The city posters; the Kaziranga one stays off the login page. */
const CITIES = REGIONS.filter((r) => r !== 'Other');

/** One region's poster, framed like a print. */
function Poster({ region, className = '' }: { region: Region; className?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-[4px] border-[3px] border-[#f5e9cf] ${className}`} style={{ background: REGION_THEMES[region].sky }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={regionImage(region, 640)} alt="" className="h-full w-full object-cover" style={{ objectPosition: REGION_THEMES[region].focus }} />
    </span>
  );
}

function LoginContent() {
  const { loginWithGoogle, loading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) router.replace(redirectTarget);
  }, [user, redirectTarget, router]);

  if (user) return null;

  return (
    <div className="kz-font grid min-h-[100svh] w-full bg-[#f5e9cf] text-[#1c130c] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* ── The poster side: every region's poster, drifting past ── */}
      <section aria-hidden="true" className="relative h-[34svh] overflow-hidden bg-[#1c130c] lg:h-auto lg:min-h-[100svh]">
        {/* Phones: one strip running sideways. */}
        <div className="absolute inset-0 flex items-center lg:hidden">
          <div className="kz-ticker flex w-max gap-3 px-3" style={{ ['--ticker-s' as string]: '70s' }}>
            {[...CITIES, ...CITIES].map((r, i) => (
              <Poster key={`${r}-${i}`} region={r} className="h-[26svh] w-auto aspect-[4/3]" />
            ))}
          </div>
        </div>
        {/* Laptops: two columns drifting in opposite directions. */}
        <div className="absolute inset-0 hidden grid-cols-2 gap-4 px-4 lg:grid">
          {[CITIES.slice(0, 5), CITIES.slice(5)].map((col, c) => (
            <div key={c} className={`flex flex-col gap-4 ${c ? 'kz-drift-down' : 'kz-drift-up'}`}>
              {[...col, ...col].map((r, i) => (
                <Poster key={`${r}-${i}`} region={r} className="w-full aspect-[4/3]" />
              ))}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(28,19,12,0.85),rgba(28,19,12,0)_45%)]" />
        <p className="kz-display kz-offset absolute bottom-[7%] left-[6%] hidden text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.9] text-[#f6b51e] lg:block" style={{ ['--offset' as string]: '#c8102e' }}>
          Come
          <br />
          on in.
        </p>
      </section>

      {/* ── The pass ── */}
      <section className="relative flex flex-col px-5 pb-10 sm:px-10 lg:min-h-[100svh] lg:px-14">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="kz-focus flex items-center gap-3 rounded-full">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
            <span className="kz-wordmark text-[1.15rem]">Kaziranga House</span>
          </Link>
          <Link href="/" className="kz-focus inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.95rem] font-medium text-[#1c130c]/75 hover:text-[#1c130c]">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to the site</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 30, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: SOFT }}
            className="kz-stamp w-full max-w-[30rem]"
            style={{ ['--stamp-bg' as string]: '#fffaf0', ['--perf' as string]: '12px' }}
          >
            <div className="border-2 border-dashed border-[#1c130c]/25 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 text-[0.9rem] font-semibold">
                <span className="text-[#c8102e]">Member pass</span>
                <span className="text-[#5e4a35]">IIT Madras BS</span>
              </div>
              <h1 className="kz-display kz-offset mt-5 text-[clamp(2.6rem,6vw,3.6rem)] leading-[0.95]" style={{ ['--offset' as string]: '#f6b51e' }}>
                Welcome back
              </h1>
              <p className="kz-body mt-4 text-[#5e4a35]">
                Sign in with your IIT Madras student Google account to register for events, build a team and follow your submissions.
              </p>

              <div className="my-7 border-t-2 border-dashed border-[#1c130c]/25" />

              <SlideToEnter onEnter={loginWithGoogle} busy={loading} />
              <p className="mt-3 text-center text-[0.85rem] text-[#5e4a35]">Or tap the Google button.</p>

              <p className="mt-6 text-[0.85rem] leading-relaxed text-[#5e4a35]">
                The portal is for Kaziranga House members. Not on the list yet? Ask your house coordinator to add you.
              </p>
            </div>
          </motion.article>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#f5e9cf]" />}>
      <LoginContent />
    </Suspense>
  );
}
