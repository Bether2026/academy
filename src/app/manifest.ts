import type { MetadataRoute } from "next";
import { t } from "@/lib/i18n";

/** App instalable: ícono y pantalla de carga con el emblema sobre fondo medianoche. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t.brand.name,
    short_name: "Learning to Fly",
    description: t.brand.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#0b1a38",
    theme_color: "#0b1a38",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
