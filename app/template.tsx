"use client";

import { motion } from "framer-motion";

// template.tsx remounts on every navigation, giving each page an enter
// transition (the App Router equivalent of the old Framer page animation).
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
      className="w-full min-h-screen origin-top"
    >
      {children}
    </motion.div>
  );
}
