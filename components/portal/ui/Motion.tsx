'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared easing. Matches `ease-editorial` in the Tailwind config so CSS
 * transitions and Framer animations feel like one system.
 */
export const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

/*
 * The portal keeps motion to a minimum so it stays quick on every device:
 * lists and blocks simply appear (animating each card in turn made long
 * lists stutter on low-end phones), and a page gets one short CSS fade.
 * These keep their old names so screens did not need rewriting.
 */

type Box = { children: React.ReactNode; className?: string };

/** A block. (It used to fade and lift in.) */
export const Reveal: React.FC<Box & { delay?: number; y?: number; onScroll?: boolean }> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

/** A grid or list. (Its items used to enter one after another.) */
export const Stagger: React.FC<Box> = ({ children, className }) => <div className={className}>{children}</div>;

export const StaggerItem: React.FC<Box> = ({ children, className }) => <div className={className}>{children}</div>;

/** Page-level entrance used by the app shell: a 0.16s fade in CSS. */
export const PageTransition: React.FC<Box> = ({ children, className }) => (
  <div className={cn('ed-page-in', className)}>{children}</div>
);
