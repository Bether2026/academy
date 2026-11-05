import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** Solo páginas públicas e indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency, priority });

  return [
    page("", 1, "weekly"),
    page("/register", 0.6, "yearly"),
    page("/login", 0.3, "yearly"),
    page("/terminos", 0.2, "yearly"),
    page("/privacidad", 0.2, "yearly"),
    page("/cancelacion", 0.2, "yearly"),
    page("/arrepentimiento", 0.2, "yearly"),
  ];
}
