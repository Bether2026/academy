"use client";

import { useActionState } from "react";
import { updateMeetingRoom, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MeetingRoomForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMeetingRoom, {});

  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          name="meetingUrl"
          type="url"
          defaultValue={current ?? ""}
          placeholder="https://meet.google.com/abc-defg-hij"
          className="min-w-0 flex-1"
        />
        <Button disabled={pending}>{pending ? "…" : "Guardar"}</Button>
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="text-xs text-sky-700">{state.message}</p>}
    </form>
  );
}
