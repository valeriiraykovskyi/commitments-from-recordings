"use client";

import { cn } from "cn";
import { CalendarClock, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SegmentPlayer } from "@/lib/client/use-segment-player";
import type {
  EventType,
  Item,
  ItemFlag,
  ItemStatus,
  Owner,
  Speaker,
} from "@/lib/commitments/types";

import { EvidenceQuote } from "./evidence-quote";

const STATUS: Record<ItemStatus, { label: string; className: string }> = {
  agreed: { label: "Agreed", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  needs_confirmation: {
    label: "Needs confirmation",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  not_agreed: { label: "Not agreed", className: "bg-neutral-100 text-neutral-600 ring-neutral-500/20" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  open: { label: "Open question", className: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  answered: { label: "Answered", className: "bg-neutral-100 text-neutral-600 ring-neutral-500/20" },
};

const EVENT_LABELS: Record<EventType, string> = {
  proposed: "Proposed",
  requested: "Requested",
  committed: "Committed",
  accepted: "Accepted",
  tentative: "Tentative",
  declined: "Declined",
  deadline: "Deadline",
  cancelled: "Cancelled",
  reinstated: "Reinstated",
  asked: "Asked",
  answered: "Answered",
};

/** Flags that ask the reader to double-check something, with the reason. */
const CHECK_FLAGS: Partial<Record<ItemFlag, { label: string; detail: string }>> = {
  speaker_mismatch: {
    label: "Check who said it",
    detail:
      "The model credited the commitment to a different person than the recording’s speaker labels do. Listen to the quote before trusting the owner.",
  },
  evidence_corrected: {
    label: "Timestamp corrected",
    detail:
      "The model pointed at the wrong place in the transcript. The quote was found elsewhere, and the timestamp comes from where it was found.",
  },
  events_dropped: {
    label: "Unverified claims dropped",
    detail:
      "Some of what the model said about this item could not be found in the transcript word for word, so it was left out.",
  },
};

function ownerText(owner: Owner): string {
  if (owner.name) return owner.name;
  if (owner.speaker !== null) return `Speaker ${owner.speaker + 1}`;
  return "Unnamed";
}

export function ItemCard({
  item,
  speakers,
  player,
}: {
  item: Item;
  speakers: readonly Speaker[];
  player: SegmentPlayer;
}) {
  const status = STATUS[item.status];
  const checks = item.flags.flatMap((flag) => {
    const check = CHECK_FLAGS[flag];
    return check ? [{ flag, ...check }] : [];
  });
  const isAgreedTask = item.kind === "task" && item.status === "agreed";
  const showOwner = item.kind === "task" && (item.owner !== null || isAgreedTask);
  const showDeadline = item.kind === "task" && (item.deadline !== null || isAgreedTask);

  return (
    <article className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className="text-base leading-snug font-medium text-balance">{item.title}</h3>
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>

        {(showOwner || showDeadline) && (
          <div className="flex flex-wrap gap-2">
            {showOwner && (
              <Chip icon={UserRound} muted={item.owner === null}>
                {item.owner ? ownerText(item.owner) : "No owner agreed"}
              </Chip>
            )}
            {showDeadline && (
              <Chip icon={CalendarClock} muted={item.deadline === null}>
                {item.deadline ? item.deadline.text : "No deadline"}
                {item.deadline && !item.deadline.dateStated && (
                  <span className="text-muted-foreground"> · date not stated in the recording</span>
                )}
              </Chip>
            )}
            {item.previousDeadlines.map((deadline, index) => (
              <Chip key={index} muted>
                corrected from <s>{deadline.text}</s>
              </Chip>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">{item.reason}</p>

        {checks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {checks.map((check) => (
              <Tooltip key={check.flag}>
                <TooltipTrigger
                  render={
                    <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-600/20 ring-inset" />
                  }
                >
                  <TriangleAlert className="size-3" />
                  {check.label}
                </TooltipTrigger>
                <TooltipContent className="max-w-72 text-pretty">{check.detail}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      <ol className="flex flex-col border-t border-foreground/10 px-2 py-2">
        {item.events.map((event, index) => (
          <li key={index}>
            <EvidenceQuote
              evidence={event.evidence}
              speakers={speakers}
              player={player}
              label={
                event.type === "deadline" && event.deadline
                  ? `Deadline: ${event.deadline}`
                  : EVENT_LABELS[event.type]
              }
            />
          </li>
        ))}
      </ol>
    </article>
  );
}

function Chip({
  icon: Icon,
  muted,
  children,
}: {
  icon?: LucideIcon;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm",
        muted
          ? "border border-dashed border-foreground/20 text-muted-foreground"
          : "bg-muted/70 text-foreground",
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
      <span>{children}</span>
    </span>
  );
}
