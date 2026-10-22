"use client";

import { motion } from "framer-motion";
import { HeartHandshake, Users, Crown, Sprout } from "lucide-react";

export default function AboutUsSection() {
  const features = [
    {
      icon: <HeartHandshake size={18} strokeWidth={2.5} />,
      title: "Vibrant Community",
      description: "Organizes meetups and networking events to foster strong connections among students.",
    },
    {
      icon: <Users size={18} strokeWidth={2.5} />,
      title: "Social Gatherings",
      description: "Hosts fun activities and social gatherings to unwind and celebrate together.",
    },
    {
      icon: <Crown size={18} strokeWidth={2.5} />,
      title: "Competitions",
      description: "Conducts in-house competitions and challenges to bring out the best in everyone.",
    },
    {
      icon: <Sprout size={18} strokeWidth={2.5} />,
      title: "Personal Growth",
      description: "Encourages collaboration, leadership, and personal growth inspired by Kaziranga's spirit.",
    },
  ];

  return (
    <section 
      id="about-us" 
      className="relative w-full bg-[#172b1e]"
    >
      {/* Subtle Radial Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 py-6 md:px-12 md:py-10 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          
          {/* Left Image with Floating Animation */}
          <motion.div 
            className="w-full md:w-5/12 flex justify-center md:justify-start"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="w-full max-w-[320px] md:max-w-[420px] relative z-20"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <img 
                src="/about_us.svg" 
                alt="About Kaziranga"
                className="w-full h-auto object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.55)] transition-transform duration-700 hover:scale-[1.02]" 
              />
            </motion.div>
          </motion.div>

          {/* Right Content */}
          <motion.div 
            className="w-full md:w-7/12 flex flex-col justify-center text-left z-10"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <h2 className="text-[32px] md:text-5xl lg:text-[48px] font-serif font-bold text-white mb-4 leading-[1.1] tracking-tight drop-shadow-sm">
              About Kaziranga House
            </h2>
            <p className="text-[#a1b5a9] text-[15px] sm:text-[16px] leading-relaxed max-w-xl mb-6 font-medium">
              We are a vibrant student community drawing inspiration from the resilience, diversity, and strength of the Kaziranga National Park. We believe in rooted resilience and rising together.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 w-full">
              {features.map((feature, i) => (
                <motion.div 
                  key={i} 
                  className="group flex flex-col items-start p-3 -m-3 rounded-2xl hover:bg-white/5 transition-colors duration-300 cursor-default"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#A3C9A8]/10 text-[#A3C9A8] group-hover:bg-[#A3C9A8]/20 group-hover:scale-110 transition-all duration-300 shadow-inner">
                      {feature.icon}
                    </div>
                    <h4 className="text-white/95 font-semibold text-[16px] tracking-wide">{feature.title}</h4>
                  </div>
                  <p className="text-white/50 text-[13px] leading-relaxed max-w-sm group-hover:text-white/70 transition-colors duration-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
