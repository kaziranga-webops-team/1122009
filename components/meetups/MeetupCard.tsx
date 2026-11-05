"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, X } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { toDirectImageUrl } from "@/lib/api";
import { formatMeetupDate, isUpcoming, type MeetupPin } from "@/lib/meetups";

/**
 * One meetup, as the map shows it: poster on the left, the facts on the
 * right. A pin can stand for several meetups — Agra alone has eleven — so the
 * card pages through them instead of stacking eleven cards on one point.
 */
export default function MeetupCard({
  meetups,
  index,
  onIndex,
  onClose,
  className = "",
}: {
  /** Newest first. Never empty. */
  meetups: MeetupPin[];
  index: number;
  onIndex: (i: number) => void;
  /** Shown when the card was opened by a tap or a click rather than a hover. */
  onClose?: () => void;
  className?: string;
}) {
  const m = meetups[Math.min(index, meetups.length - 1)];
  const many = meetups.length > 1;
  const place = [m.city, m.state].filter(Boolean).join(", ");

  return (
    <article
      className={`kz-font w-[min(21.5rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#002820]/15 bg-white text-[#002820] shadow-[0_18px_40px_-14px_rgba(0,40,32,0.45)] ${className}`}
    >
      <div className="flex">
        <Poster key={m.key} src={m.poster} city={m.city} />

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="kz-label flex flex-wrap items-center gap-1.5 text-[0.62rem] text-[#c10021]">
              {isUpcoming(m) && <span className="rounded-full bg-[#c10021] px-1.5 py-0.5 text-[0.54rem] text-white">Upcoming</span>}
              {formatMeetupDate(m.date) || "Date to come"}
            </p>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1.5 -mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#3f5a52] transition-colors hover:bg-[#002820]/5 hover:text-[#002820]"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <h3 className="mt-2 line-clamp-3 text-[0.95rem] font-bold leading-snug">{m.venue || place}</h3>

          {place && (
            <p className="mt-2 flex items-start gap-1.5 text-[0.78rem] font-semibold leading-snug text-[#3f5a52]">
              <MapPin size={13} className="mt-[0.15rem] shrink-0 text-[#006255]" />
              <span>{place}</span>
            </p>
          )}

          {m.instagram && (
            <div className="mt-auto pt-3">
              <a
                href={m.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#002820] px-3 py-1.5 text-[0.72rem] font-semibold text-[#f9fbe5] transition-colors hover:bg-[#006255]"
              >
                <FaInstagram size={12} /> See the post
              </a>
            </div>
          )}
        </div>
      </div>

      {/* A strip of its own: beside the Instagram button there is not room
          for both on a 344 px card, and the button folded into three lines. */}
      {many && (
        <div className="flex items-center justify-between gap-3 border-t border-[#002820]/10 bg-[#f9fbe5] px-4 py-2">
          <span className="text-[0.7rem] font-bold tabular-nums text-[#3f5a52]">
            {index + 1} of {meetups.length} meetups here
          </span>
          <div className="flex items-center gap-1.5">
            <PageButton label="Newer meetup" disabled={index === 0} onClick={() => onIndex(index - 1)}>
              <ArrowLeft size={13} />
            </PageButton>
            <PageButton label="Older meetup" disabled={index === meetups.length - 1} onClick={() => onIndex(index + 1)}>
              <ArrowRight size={13} />
            </PageButton>
          </div>
        </div>
      )}
    </article>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full border border-[#002820]/20 transition-colors enabled:hover:bg-[#002820] enabled:hover:text-[#f9fbe5] disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/**
 * Posters are 4:5 or square. A 4:5 frame shows the tall ones whole and
 * trims a sliver off the sides of the square ones, which keeps the card one
 * height whichever meetup it is on.
 */
function Poster({ src, city }: { src: string; city: string }) {
  const [failed, setFailed] = useState(false);
  const url = src ? toDirectImageUrl(src) : "";

  return (
    <div className="relative w-[7.25rem] shrink-0 self-stretch bg-[#dcebd8]">
      <div className="aspect-[4/5] h-full w-full">
        {url && !failed ? (
          // A plain img: posters come from several hosts, and next/image would
          // need each one allow-listed for no gain at this size.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#006255] p-3 text-center">
            <span className="kz-label text-[0.6rem] text-white/80">{city || "Meetup"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
