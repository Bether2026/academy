"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { LibraryMaterial, ShareableStudent } from "@/lib/services/materials";

type ActionState = { error?: string; message?: string };
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const selectClass =
  "border-input h-8 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

const m = t.materials;

function SharePanel({ material, students, shareAction, unshareAction }: {
  material: LibraryMaterial;
  students: ShareableStudent[];
  shareAction: Action;
  unshareAction: Action;
}) {
  const [shareState, share, sharing] = useActionState<ActionState, FormData>(shareAction, {});
  const [unshareState, unshare] = useActionState<ActionState, FormData>(unshareAction, {});
  const nameOf = (id: string | null) => students.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
      <p className="text-xs font-medium">{m.sharedWith}</p>
      {material.shares.length ? (
        <div className="flex flex-wrap gap-1.5">
          {material.shares.map((sh) => (
            <form key={sh.id} action={unshare} className="inline-flex">
              <input type="hidden" name="shareId" value={sh.id} />
              <Badge variant="secondary" className="gap-1.5">
                {sh.level ? `${m.wholeLevel} ${sh.level}` : nameOf(sh.student_id)}
                <button type="submit" aria-label={m.remove} className="text-muted-foreground hover:text-destructive">
                  ×
                </button>
              </Badge>
            </form>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{m.notShared}</p>
      )}
      <form action={share} className="flex flex-wrap gap-2">
        <input type="hidden" name="materialId" value={material.id} />
        <select name="target" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            {m.chooseTarget}
          </option>
          {material.level && <option value={`level:${material.level}`}>{`${m.wholeLevel} ${material.level}`}</option>}
          {students.map((s) => (
            <option key={s.id} value={`student:${s.id}`}>
              {s.name}
              {s.level ? ` (${s.level})` : ""}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={sharing}>
          {m.share}
        </Button>
      </form>
      {(shareState.error || unshareState.error) && <p className="text-xs text-destructive">{shareState.error ?? unshareState.error}</p>}
      {shareState.message && <p className="text-xs text-sky-700">{shareState.message}</p>}
    </div>
  );
}

/** Biblioteca para profesores y admins: material por nivel y unidad, con compartir. */
export function MaterialsLibrary({ materials, students, shareAction, unshareAction }: {
  materials: LibraryMaterial[];
  students: ShareableStudent[];
  shareAction: Action;
  unshareAction: Action;
}) {
  const levels = LEVELS.filter((l) => materials.some((x) => x.level === l));
  const [level, setLevel] = useState(levels[0] ?? "A1");
  const [open, setOpen] = useState<string | null>(null);

  const ofLevel = materials.filter((x) => x.level === level);
  const units = [...new Set(ofLevel.map((x) => x.unit ?? 0))].sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-full border bg-card p-1">
        {levels.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={level === l}
            onClick={() => setLevel(l)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
              level === l ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {!units.length && <p className="text-sm text-muted-foreground">{m.empty}</p>}

      <div className="space-y-3">
        {units.map((u) => {
          const items = ofLevel.filter((x) => (x.unit ?? 0) === u);
          const student = items.find((x) => x.audience === "student");
          const guide = items.find((x) => x.audience === "teacher");
          const title = (student ?? guide)?.title.replace(/ — .*$/, "") ?? "";
          const sharedCount = student?.shares.length ?? 0;
          return (
            <Card key={u}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {u === 0 ? m.syllabus : `${m.unit} ${u}`}
                    </p>
                    <p className="font-medium">{title}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {student && (
                      <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/materiales/${student.id}`} target="_blank" rel="noreferrer" />}>
                        {u === 0 ? m.open : m.studentBook}
                      </Button>
                    )}
                    {guide && (
                      <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/materiales/${guide.id}`} target="_blank" rel="noreferrer" />}>
                        {m.teacherGuide}
                      </Button>
                    )}
                    {student && (
                      <Button size="sm" onClick={() => setOpen(open === student.id ? null : student.id)}>
                        {m.share}
                        {sharedCount > 0 && ` (${sharedCount})`}
                      </Button>
                    )}
                  </div>
                </div>
                {student && open === student.id && (
                  <SharePanel material={student} students={students} shareAction={shareAction} unshareAction={unshareAction} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
