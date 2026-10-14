import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Cinzel, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { IosInstallHint } from "@/components/features/ios-install-hint";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const brand = Cinzel({
  variable: "--font-brand-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Pantallas de carga de iPhone (public/splash): [ancho, alto, densidad] en puntos CSS
const IOS_SPLASH: [number, number, number][] = [
  [440, 956, 3], [430, 932, 3], [428, 926, 3], [420, 912, 3], [414, 896, 3], [414, 896, 2],
  [414, 736, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2],
];

export const metadata: Metadata = {
  title: {
    default: "Learning to Fly Academy — Aprendé inglés con profesores reales",
    template: "%s · Learning to Fly Academy",
  },
  description:
    "Clases individuales de inglés online con profesores reales, seguimiento personalizado y progreso que podés ver. Para Argentina y España.",
  appleWebApp: {
    capable: true,
    title: "Learning to Fly",
    statusBarStyle: "black-translucent",
    startupImage: IOS_SPLASH.map(([w, h, dpr]) => ({
      url: `/splash/splash-${w * dpr}x${h * dpr}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    })),
  },
};

// Color de la barra del sistema y de la app instalada (medianoche de la marca)
export const viewport: Viewport = {
  themeColor: "#0b1a38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${brand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <IosInstallHint />
      </body>
    </html>
  );
}
