"use client";

import { useRef } from "react";

const REST = "rotateX(10deg) rotateY(-14deg)";

/** Inclina el emblema siguiendo el mouse (perspectiva 3D). En táctil queda en reposo. */
export function EmblemTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const stage = () => ref.current?.querySelector<HTMLElement>("[data-stage]");

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const s = stage();
    if (s) s.style.transform = `rotateX(${(-y * 26).toFixed(2)}deg) rotateY(${(x * 32).toFixed(2)}deg)`;
  }

  function onLeave() {
    const s = stage();
    if (s) s.style.transform = REST;
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="[perspective:1400px] [&_[data-stage]]:[transform:rotateX(10deg)_rotateY(-14deg)]"
    >
      {children}
    </div>
  );
}
