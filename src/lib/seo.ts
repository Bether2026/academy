import { t } from "@/lib/i18n";

/** URL pública canónica (el dominio propio, con www). */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.learningtoflyacademy.com";

/** Páginas privadas: fuera de los buscadores. */
export const NO_INDEX = { index: false, follow: false } as const;

/** Datos estructurados (schema.org) de la home: academia + sitio + preguntas frecuentes. */
export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: t.brand.name,
        url: SITE_URL,
        logo: `${SITE_URL}/icons/icon-512.png`,
        image: `${SITE_URL}/opengraph-image.png`,
        description: t.seo.description,
        email: t.brand.email,
        telephone: `+${t.brand.whatsapp}`,
        areaServed: [
          { "@type": "Country", name: "Argentina" },
          { "@type": "Country", name: "España" },
        ],
        knowsLanguage: ["es", "en"],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: `+${t.brand.whatsapp}`,
          email: t.brand.email,
          availableLanguage: ["Spanish", "English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: t.brand.name,
        inLanguage: "es",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        mainEntity: t.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}
