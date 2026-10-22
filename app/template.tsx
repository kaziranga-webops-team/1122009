// template.tsx remounts on every navigation, giving each page an enter
// transition (the App Router equivalent of the old Framer page animation).
//
// This is deliberately a CSS animation rather than a JS one. As a framer-motion
// `initial={{ opacity: 0 }}`, the entire site stayed invisible whenever the
// animation did not run — a backgrounded tab on first paint is enough, because
// the browser stops serving animation frames. The page's resting state is now
// visible, and the animation only plays it in; if it never runs, nothing is lost.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter w-full min-h-screen origin-top">{children}</div>;
}
