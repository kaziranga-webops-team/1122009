'use client';

import { Suspense, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarCheck, Loader2, ShieldCheck, Trophy, UsersRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Ambient from '@/components/kz/Ambient';
import { Butterflies, Clouds, Rhino, SceneBackdrop, WordRise } from '@/components/kz/Scene';
import { vars } from '@/components/kz/util';

const SOFT = [0.22, 1, 0.36, 1] as const;

const PERKS = [
  { Icon: CalendarCheck, label: 'Register for events' },
  { Icon: UsersRound, label: 'Build a team' },
  { Icon: Trophy, label: 'Track submissions' },
];

function GoogleMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
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
    <div className="kz-font relative min-h-[100svh] w-full overflow-hidden bg-[#8ef0fb] text-[#002820]">
      {/* ── the valley ── */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="kz-frame">
          <div className="kz-stage">
            <SceneBackdrop priority />
          </div>
          <Clouds count={3} />
          <Ambient birds={3} specks={0} seed={9} sky={[6, 30]} />
          <Butterflies />
          <div className="kz-on-stage kz-on-stage--rhino" style={vars({ '--rx': 0.66, '--ry': 0.57, '--rw': 0.25 })}>
            <div className="kz-walk-in">
              <Rhino greet={false} />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_45%,rgba(0,40,32,0.18),rgba(0,40,32,0)_70%)]" />
      </div>

      {/* ── top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 md:px-10">
        <Link href="/" className="group flex items-center gap-3 rounded-full bg-[#f9fbe5]/85 py-1.5 pl-1.5 pr-4 shadow-[0_10px_30px_-16px_rgba(0,40,32,0.5)] backdrop-blur">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full transition-transform duration-700 group-hover:rotate-[360deg]" />
          <span className="kz-wordmark text-[1rem]">kaziranga house</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[#002820] px-4 py-2.5 text-[0.88rem] font-semibold text-[#f9fbe5] transition-colors hover:bg-[#006255]"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to the site</span>
        </Link>
      </header>

      {/* ── sign-in card ── */}
      <main className="relative z-10 flex min-h-[calc(100svh-5.5rem)] items-start justify-center px-5 pb-[min(48vw,18rem)] pt-[4svh] sm:items-center sm:pb-24 sm:pt-0">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: SOFT }}
          className="w-full max-w-[460px] rounded-[2rem] border border-white/60 bg-[#f9fbe5]/92 p-7 shadow-[0_40px_80px_-40px_rgba(0,40,32,0.6)] backdrop-blur-md sm:p-9"
        >
          <p className="kz-label kz-mark text-[#c6011f]">House portal</p>
          <h1 className="mt-4 text-[clamp(2rem,4.6vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            <span className="block">
              <WordRise text="Welcome back" base={0.35} />
            </span>
            <span className="block">
              <WordRise text="to the house" start={2} base={0.35} />
              <span className="kz-pop inline-block text-[#c6011f]" style={vars({ '--delay': '0.9s' })}>
                .
              </span>
            </span>
          </h1>
          <p className="kz-body mt-4 text-[#4b6660]">
            Sign in with your official IIT Madras student account to join house events, form teams and follow your submissions.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {PERKS.map(({ Icon, label }, i) => (
              <li
                key={label}
                className="kz-rise inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1d3d35]"
                style={vars({ '--i': 4 + i })}
              >
                <Icon size={15} className="text-[#006255]" /> {label}
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={loading}
            onClick={loginWithGoogle}
            className="group mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#002820] text-[0.98rem] font-semibold text-[#f9fbe5] shadow-[0_18px_30px_-18px_rgba(0,40,32,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#006255] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white transition-transform duration-500 group-hover:rotate-[360deg]">
              {loading ? <Loader2 size={18} className="animate-spin text-[#002820]" /> : <GoogleMark />}
            </span>
            {loading ? 'Signing you in…' : 'Continue with Google'}
          </button>

          <p className="mt-5 flex items-start gap-2 text-[0.78rem] leading-relaxed text-[#4b6660]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#006255]" />
            Access is limited to Kaziranga House members. Not on the roster? Reach out to your house coordinator.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#8ef0fb]" />}>
      <LoginContent />
    </Suspense>
  );
}
