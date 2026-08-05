"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-shell";

export function AppNav({ nav, home }: { nav: NavItem[]; home: string }) {
  const path = usePathname();

  function isActive(href: string) {
    if (href === home) return path === href;
    return path === href || path.startsWith(href + "/");
  }

  return (
    <nav
      className="flex gap-1 overflow-x-auto px-4 pb-2 pt-1 scrollbar-hide"
      style={{ scrollbarWidth: "none" }}
    >
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              active
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/55 hover:bg-white/8 hover:text-white/80"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
