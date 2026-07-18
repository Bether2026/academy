import { cn } from "@/lib/utils";

/** Isotipo: avión de papel ascendente con estela. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="ltf-sky" x1="4" y1="28" x2="29" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#1d3a8a" />
        </linearGradient>
      </defs>
      {/* estela */}
      <path
        d="M3 28c4-1 7.5-3.2 10-6.5"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3.2"
      />
      {/* ala superior */}
      <path d="M29 3 4.5 16.5l10 1.8L29 3Z" fill="url(#ltf-sky)" />
      {/* cuerpo inferior */}
      <path d="M29 3 14.5 18.3l1.7 8.2 4.1-6.5L29 3Z" fill="url(#ltf-sky)" fillOpacity="0.75" />
    </svg>
  );
}

/** Logo completo: isotipo + wordmark. */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-[1.05rem] font-bold tracking-tight",
            dark ? "text-white" : "text-primary",
          )}
        >
          Learning to Fly
        </span>
        <span
          className={cn(
            "text-[0.62rem] font-semibold uppercase tracking-[0.32em]",
            dark ? "text-sky-300" : "text-sky-600",
          )}
        >
          Academy
        </span>
      </span>
    </span>
  );
}
