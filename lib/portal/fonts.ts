import { Bricolage_Grotesque, Manrope } from 'next/font/google';

/**
 * The portal's two faces: Bricolage Grotesque for display (headings, the
 * wordmark, big numbers) and Manrope for everything read at length. They are
 * exposed as CSS variables and picked up by `.ed-app` in portal.css, so the
 * public site keeps its own Montserrat.
 */
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-portal-display',
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-portal-body',
  display: 'swap',
});

export const portalFontVars = `${display.variable} ${body.variable}`;
