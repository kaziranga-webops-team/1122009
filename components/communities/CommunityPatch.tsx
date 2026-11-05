import Image from "next/image";
import type { Community } from "@/lib/communities";

/**
 * A community's badge, made like a sew-on patch: a coloured disc with a
 * stitched ring inside the edge. Shows the community's logo once one is set,
 * and its icon until then.
 */
export default function CommunityPatch({ c, size = 88, className = "" }: { c: Community; size?: number; className?: string }) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-full shadow-[0_10px_18px_-12px_rgba(0,40,32,0.6),inset_0_-3px_0_rgba(0,0,0,0.12)] ${className}`}
      style={{ width: size, height: size, background: c.bg, color: c.ink }}
    >
      {/* the stitching */}
      <span aria-hidden="true" className="absolute inset-[7%] rounded-full border-[1.5px] border-dashed border-current opacity-45" />
      {c.logo ? (
        <Image src={c.logo} alt={`${c.name} logo`} width={size} height={size} className="relative h-[70%] w-[70%] rounded-full object-contain" />
      ) : (
        <c.Icon aria-hidden="true" strokeWidth={1.7} className="relative" style={{ width: size * 0.4, height: size * 0.4 }} />
      )}
    </span>
  );
}
