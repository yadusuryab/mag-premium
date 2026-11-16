"use client";

const ITEMS = [
  "Free shipping on orders paid online",
  "Handpicked fashion, curated just for you",
  "Secure checkout, 100% safe payments",
];

// One group = the items repeated twice, wide enough to cover large screens
const Group = ({ hidden }: { hidden?: boolean }) => (
  <ul aria-hidden={hidden} className="flex shrink-0 items-center">
    {[...ITEMS, ...ITEMS].map((text, i) => (
      <li key={i} className="flex items-center whitespace-nowrap text-md font-bold tracking-tight">
        {text}
        <span aria-hidden="true" className="mx-6 h-1 w-1 rounded-full bg-white/40" />
      </li>
    ))}
  </ul>
);

export default function MarqueeStrip() {
  return (
    <>
      <style>{`
        @keyframes marquee { to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 40s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>

      <section aria-label="Store highlights" className="w-full select-none overflow-hidden bg-black py-3 text-white">
        {/* w-max is required: translateX(-50%) must be half of the content width, not the screen width */}
        <div className="marquee-track flex w-max will-change-transform">
          <Group />
          <Group hidden />
        </div>
      </section>
    </>
  );
}