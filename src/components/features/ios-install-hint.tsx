"use client";

import { useEffect, useState } from "react";
import { ShareIcon, SquarePlusIcon, XIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { t } from "@/lib/i18n";

const DISMISS_KEY = "ltf-ios-install-dismissed";

/** iPhone/iPad en Safari, sin la app instalada (iOS no ofrece "Instalar" automático). */
function shouldShow() {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const installed =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    // sin almacenamiento (modo privado): se muestra igual
  }
  return isIos && !installed && !dismissed;
}

export function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // pequeña demora para no tapar la carga inicial
    const id = setTimeout(() => setVisible(shouldShow()), 2500);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignorar
    }
  }

  const m = t.installHint;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md animate-fade-up-0 rounded-2xl border border-white/15 bg-[#0b1a38]/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={dismiss}
        aria-label={m.dismiss}
        className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
      >
        <XIcon className="size-4" />
      </button>
      <div className="flex gap-3 pr-6">
        <LogoMark className="h-11 w-11" />
        <div className="space-y-1.5 text-sm">
          <p className="font-semibold">{m.title}</p>
          <p className="flex flex-wrap items-center gap-1 text-white/75">
            {m.step1}
            <ShareIcon className="inline size-4 text-sky-300" aria-hidden />
            <strong className="font-semibold text-white">{m.share}</strong>
            {m.step2}
            <SquarePlusIcon className="inline size-4 text-sky-300" aria-hidden />
            <strong className="font-semibold text-white">{m.addToHome}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
