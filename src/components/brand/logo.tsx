import { useId } from "react";
import { cn } from "@/lib/utils";
import { EmblemTilt } from "./emblem-tilt";

/*
 * Marca "cromo sobre medianoche". Todas las formas comparten un lienzo de 1000×1000:
 * se dibujan en blanco dentro de máscaras y se rellenan con degradados metálicos.
 * Las capas desplazadas debajo de cada forma simulan el espesor (extrusión).
 */

const EXTRUDE = ["#141d2c", "#26344b", "#384862", "#4a5b77", "#5d6f8c"];

/** Avión de frente con estela principal. Negro = huecos (parabrisas, turbinas). */
function PlaneShape() {
  return (
    <>
      <polygon points="500,148 493,268 507,268" fill="#fff" />
      <polygon points="438,266 500,256 562,266 562,271 500,268 438,271" fill="#fff" />
      <polygon points="222,298 455,286 545,286 778,298 778,305 545,320 455,320 222,305" fill="#fff" />
      <ellipse cx="500" cy="300" rx="38" ry="38" fill="#fff" />
      <path d="M477,290 Q500,276 523,290 L519,299 Q500,292 481,299Z" fill="#000" />
      <circle cx="416" cy="326" r="23" fill="#fff" />
      <circle cx="584" cy="326" r="23" fill="#fff" />
      <circle cx="411" cy="322" r="9" fill="#000" />
      <circle cx="579" cy="322" r="9" fill="#000" />
      <path d="M490,342 C488,450 420,540 300,582 C410,558 474,480 506,342Z" fill="#fff" />
    </>
  );
}

const BRAND_FONT = { fontFamily: "var(--font-brand-serif), serif" };

const TRAIL2 = "M514,342 C520,450 482,540 412,586 C504,546 534,460 526,342Z";

function CloudShape() {
  return (
    <>
      <circle cx="232" cy="545" r="32" />
      <circle cx="268" cy="510" r="42" />
      <circle cx="318" cy="488" r="48" />
      <circle cx="372" cy="512" r="40" />
      <circle cx="414" cy="540" r="32" />
      <circle cx="320" cy="545" r="46" />
      <circle cx="628" cy="535" r="34" />
      <circle cx="676" cy="502" r="44" />
      <circle cx="730" cy="470" r="50" />
      <circle cx="790" cy="455" r="44" />
      <circle cx="832" cy="492" r="38" />
      <circle cx="720" cy="540" r="48" />
      <circle cx="800" cy="535" r="42" />
      <rect x="200" y="540" width="240" height="40" />
      <rect x="610" y="530" width="260" height="50" />
    </>
  );
}

/** Degradados compartidos (ids con prefijo para poder repetir el logo en la página). */
function ChromeGradients({ p }: { p: string }) {
  return (
    <>
      <linearGradient id={`${p}-chrome`} x1="0" y1="0" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".45" stopColor="#b9c6d6" />
        <stop offset=".6" stopColor="#eef3f9" />
        <stop offset=".625" stopColor="#4a5a72" />
        <stop offset=".68" stopColor="#9fb0c6" />
        <stop offset=".8" stopColor="#f2f6fb" />
        <stop offset="1" stopColor="#8a9ab0" />
      </linearGradient>
      <linearGradient id={`${p}-chromePlane`} x1="0" y1="140" x2="0" y2="600" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".3" stopColor="#dfe7f1" />
        <stop offset=".34" stopColor="#3d4c63" />
        <stop offset=".45" stopColor="#a7b6ca" />
        <stop offset="1" stopColor="#ffffff" />
      </linearGradient>
      <linearGradient id={`${p}-trail`} x1="0" y1="340" x2="0" y2="590" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#cfe6ff" />
        <stop offset="1" stopColor="#4f93e0" stopOpacity=".2" />
      </linearGradient>
      <linearGradient id={`${p}-cloud`} x1="0" y1="430" x2="0" y2="585" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#d6e8ff" stopOpacity=".75" />
        <stop offset="1" stopColor="#d6e8ff" stopOpacity="0" />
      </linearGradient>
    </>
  );
}

/** Isotipo: avión cromado dentro del aro, sobre disco medianoche. Pensado para 28–48px. */
export function LogoMark({ className }: { className?: string }) {
  const p = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const url = (n: string) => `url(#${p}-${n})`;

  return (
    <svg
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <ChromeGradients p={p} />
        <radialGradient id={`${p}-night`} cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#24498a" />
          <stop offset=".6" stopColor="#0f2350" />
          <stop offset="1" stopColor="#081633" />
        </radialGradient>
        <clipPath id={`${p}-disc`}>
          <circle cx="500" cy="500" r="430" />
        </clipPath>
        <mask id={`${p}-plane`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
          <PlaneShape />
        </mask>
        <mask id={`${p}-clouds`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
          <g fill="#fff">
            <CloudShape />
          </g>
        </mask>
      </defs>

      <circle cx="500" cy="500" r="490" fill={url("chrome")} />
      <circle cx="500" cy="500" r="440" fill="#0a1530" />
      <circle cx="500" cy="500" r="430" fill={url("night")} />

      <g clipPath={url("disc")}>
        <g transform="translate(500 520) scale(1.15) translate(-500 -380)">
          <rect width="1000" height="1000" fill={url("cloud")} mask={url("clouds")} />
          {EXTRUDE.map((c, i) => (
            <rect
              key={c}
              width="1000"
              height="1000"
              fill={c}
              mask={url("plane")}
              transform={`translate(${(5 - i) * 1.5} ${(5 - i) * 4})`}
            />
          ))}
          <path d={TRAIL2} fill={url("trail")} />
          <rect width="1000" height="1000" fill={url("chromePlane")} mask={url("plane")} />
        </g>
      </g>
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** Texto claro para fondos oscuros. */
  dark?: boolean;
};

/** Logo horizontal: isotipo + nombre en serif clásica. Para barras de navegación. */
export function Logo({ className, dark = false }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2 sm:gap-2.5", className)}>
      <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
      <span className="flex flex-col leading-none">
        {/* en mobile: LEARNING / TO FLY en dos líneas; desde sm: LEARNING TO FLY / ACADEMY */}
        <span
          className={cn(
            "font-brand text-[0.85rem] font-semibold tracking-[0.05em] sm:text-[1.02rem] sm:tracking-[0.06em]",
            dark ? "text-white" : "text-[#13285c]",
          )}
        >
          LEARNING{" "}
          <span className={cn("block sm:inline", dark ? "text-sky-300" : "text-[#4f78b8]")}>
            TO FLY
          </span>
        </span>
        <span
          className={cn(
            "mt-1 hidden font-brand text-[0.58rem] tracking-[0.45em] sm:block",
            dark ? "text-white/70" : "text-[#13285c]/80",
          )}
        >
          ACADEMY
        </span>
      </span>
    </span>
  );
}

type EmblemProps = {
  className?: string;
  /** Envuelve el emblema en un recuadro medianoche (para fondos claros). */
  framed?: boolean;
  /** Inclinación con el mouse y brillo animado. Solo para piezas destacadas (portada). */
  interactive?: boolean;
};

/** Emblema completo cromado: aro, avión, nubes y nombre. Para piezas grandes (≥160px). */
export function LogoEmblem({ className, framed = false, interactive = false }: EmblemProps) {
  const p = `e${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const url = (n: string) => `url(#${p}-${n})`;
  const layer = "absolute inset-0 h-full w-full overflow-visible";
  const m = (id: string, children: React.ReactNode) => (
    <mask id={`${p}-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
      {children}
    </mask>
  );

  const typeShapes = (
    <>
      <path d="M118.3,580 A390,390 0 1 1 881.7,580" fill="none" stroke="#fff" strokeWidth="8" />
      <path d="M251,800 A390,390 0 0 0 749,800" fill="none" stroke="#fff" strokeWidth="8" />
      <text x="500" y="660" textAnchor="middle" style={BRAND_FONT} fontWeight="600" fontSize="112" letterSpacing="5" fill="#fff">
        LEARNING
      </text>
      <polygon points="500,779 503.8,789.7 515.2,790.1 506.2,797 509.4,807.9 500,801.5 490.6,807.9 493.8,797 484.8,790.1 496.2,789.7" fill="#fff" />
      <path d="M412,793 L478,791 L478,797 L412,795Z M588,793 L522,791 L522,797 L588,795Z" fill="#fff" />
      <text style={BRAND_FONT} fontWeight="600" fontSize="40" letterSpacing="16" fill="#fff">
        <textPath href={`#${p}-acad`} startOffset="50%" textAnchor="middle">
          ACADEMY
        </textPath>
      </text>
    </>
  );
  const accentShapes = (
    <>
      <text x="500" y="752" textAnchor="middle" style={BRAND_FONT} fontWeight="500" fontSize="60" letterSpacing="18" fill="#fff">
        TO FLY
      </text>
      <path d="M140,722 L320,720 L320,725 L140,724Z M175,734 L320,733 L320,736 L175,735Z M860,722 L680,720 L680,725 L860,724Z M825,734 L680,733 L680,736 L825,735Z" fill="#fff" />
    </>
  );

  const emblem = (
    <div data-stage className="relative aspect-square w-full [transform-style:preserve-3d] transition-transform duration-500 ease-out">
      {/* definiciones compartidas por las tres capas */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <ChromeGradients p={p} />
          <path id={`${p}-acad`} d="M210.3,700 A352,352 0 0 0 789.7,700" fill="none" />
          <linearGradient id={`${p}-sky`} x1="0" y1="690" x2="0" y2="760" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#bfe0ff" />
            <stop offset="1" stopColor="#4f93e0" />
          </linearGradient>
          <linearGradient id={`${p}-shine`} x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".85" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${p}-ring`}>
            <circle cx="500" cy="500" r="384" />
          </clipPath>
          {m("type", typeShapes)}
          {m("accent", accentShapes)}
          {m("front", <>{typeShapes}{accentShapes}</>)}
          {m("plane", <PlaneShape />)}
          {m("bird", <><PlaneShape /><path d={TRAIL2} fill="#fff" /></>)}
          {m("clouds", <g fill="#fff" clipPath={url("ring")}><CloudShape /></g>)}
          <filter id={`${p}-bevel`} filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b" />
            <feSpecularLighting in="b" surfaceScale="5" specularConstant="1.2" specularExponent="24" lightingColor="#ffffff" result="s">
              <feDistantLight azimuth="235" elevation="42" />
            </feSpecularLighting>
            <feComposite in="s" in2="SourceAlpha" operator="in" result="s2" />
            <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3="0.75" k4="0" />
          </filter>
          <filter id={`${p}-soft`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={`${p}-glow`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id={`${p}-blur`} filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      </svg>

      {/* capa 1: aro y nombre */}
      <svg viewBox="0 0 1000 1000" className={layer} aria-hidden>
        <rect width="1000" height="1000" fill="#6fb2ff" opacity=".35" mask={url("front")} filter={url("glow")} />
        <rect width="1000" height="1000" fill="#000" opacity=".6" mask={url("front")} transform="translate(4,22)" filter={url("soft")} />
        {EXTRUDE.map((c, i) => (
          <rect key={c} width="1000" height="1000" fill={c} mask={url("front")} transform={`translate(${(5 - i) * 0.6} ${(5 - i) * 1.8})`} />
        ))}
        <g filter={url("bevel")}>
          <rect width="1000" height="1000" fill={url("chrome")} mask={url("type")} />
          <rect width="1000" height="1000" fill={url("sky")} mask={url("accent")} />
        </g>
        {interactive && (
          <g mask={url("front")}>
            <rect className="animate-shine" width="1000" height="1000" fill={url("shine")} />
          </g>
        )}
      </svg>

      {/* capa 2: nubes */}
      <svg viewBox="0 0 1000 1000" className={layer} style={{ transform: "translateZ(45px)" }} aria-hidden>
        <rect width="1000" height="1000" fill={url("cloud")} mask={url("clouds")} filter={url("blur")} />
      </svg>

      {/* capa 3: avión y estela */}
      <svg viewBox="0 0 1000 1000" className={layer} style={{ transform: "translateZ(100px)" }} aria-hidden>
        <rect width="1000" height="1000" fill="#000" opacity=".55" mask={url("bird")} transform="translate(10,40)" filter={url("soft")} />
        {EXTRUDE.map((c, i) => (
          <rect key={c} width="1000" height="1000" fill={c} mask={url("plane")} transform={`translate(${(5 - i) * 0.6} ${(5 - i) * 2})`} />
        ))}
        <path d={TRAIL2} fill={url("trail")} />
        <g filter={url("bevel")}>
          <rect width="1000" height="1000" fill={url("chromePlane")} mask={url("plane")} />
        </g>
        {interactive && (
          <g mask={url("plane")}>
            <rect className="animate-shine" width="1000" height="1000" fill={url("shine")} />
          </g>
        )}
      </svg>
    </div>
  );

  return (
    <div
      role="img"
      aria-label="Learning to Fly Academy"
      className={cn(
        framed &&
          "rounded-3xl bg-[radial-gradient(circle_at_50%_40%,#1f3f7a_0%,#0b1a38_55%,#050c1c_100%)] p-[6%] shadow-[0_24px_48px_rgba(5,12,28,0.3)]",
        className,
      )}
    >
      {interactive ? <EmblemTilt>{emblem}</EmblemTilt> : emblem}
    </div>
  );
}
