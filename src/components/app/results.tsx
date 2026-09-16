"use client";

import { cn } from "cn";
import { Ban, ChevronDown, CircleCheck, CircleQuestionMark, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SegmentPlayer } from "@/lib/client/use-segment-player";
import type { Clarification, Commitments, Item } from "@/lib/commitments/types";

import { ItemCard } from "./item-card";
import { Notice } from "./notice";

/** The three blocks from the plan: agreed, unresolved, and what is not a commitment. */
export function ResultsView({
  commitments,
  player,
}: {
  commitments: Commitments;
  player: SegmentPlayer;
}) {
  const { items, speakers, clarifications, dropped } = commitments;
  const agreed = items.filter((item) => item.status === "agreed");
  const unresolved = items.filter(
    (item) => item.status === "needs_confirmation" || item.status === "open",
  );
  const excluded = items.filter((item) => !agreed.includes(item) && !unresolved.includes(item));
  const card = (item: Item) => (
    <ItemCard key={item.id} item={item} speakers={speakers} player={player} />
  );

  return (
    <div className="flex flex-col gap-8">
      {clarifications.map((clarification, index) => (
        <ClarificationNotice key={index} clarification={clarification} />
      ))}

      <Section
        icon={CircleCheck}
        iconClass="text-emerald-600"
        title="Agreed"
        count={agreed.length}
        hint="Tasks that were explicitly accepted or taken on, and never cancelled."
        empty="Nothing was agreed in this recording."
      >
        {agreed.map(card)}
      </Section>

      <Section
        icon={CircleQuestionMark}
        iconClass="text-sky-600"
        title="Unresolved"
        count={unresolved.length}
        hint="Questions nobody answered, and tasks that only got a tentative reply."
        empty="No open questions or tentative replies."
      >
        {unresolved.map(card)}
      </Section>

      {(excluded.length > 0 || dropped.length > 0) && (
        <Collapsible className="flex flex-col gap-3">
          <CollapsibleTrigger className="group/excluded -mx-1 flex items-center gap-2 rounded-lg px-1 py-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50">
            <Ban className="size-4 text-muted-foreground" />
            <span className="text-lg font-semibold tracking-tight">Not commitments</span>
            <Count value={excluded.length + dropped.length} />
            <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-data-panel-open/excluded:rotate-180" />
          </CollapsibleTrigger>
          <p className="-mt-2 text-sm text-muted-foreground">
            Proposals that were never accepted, cancelled tasks and answered questions, kept so
            you can check why they are left out.
          </p>
          <CollapsibleContent className="flex flex-col gap-3">
            {excluded.map(card)}
            {dropped.length > 0 && (
              <div className="rounded-xl border border-dashed border-foreground/15 p-4">
                <p className="text-sm font-medium">Unverified model output</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Claims the model made that could not be found in the transcript word for word.
                  They were dropped and never counted.
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {dropped.map((entry, index) => (
                    <li key={index} className="text-muted-foreground">
                      <span className="text-foreground/80">“{entry.quote}”</span> — {entry.item},{" "}
                      {entry.type}: {entry.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  iconClass,
  title,
  count,
  hint,
  empty,
  children,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  count: number;
  hint: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header>
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", iconClass)} />
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <Count value={count} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </header>
      {count === 0 ? (
        <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

function ClarificationNotice({ clarification }: { clarification: Clarification }) {
  if (clarification.type === "speaker_names") {
    const labels = clarification.labels.map((label) => `Speaker ${label + 1}`);
    const all = clarification.labels.length > 1;
    return (
      <Notice tone="warning" title="Who is who?">
        {all
          ? `Neither speaker introduces themselves, so owners are shown as ${labels.join(" and ")}.`
          : `${labels[0]} never introduces themselves, so their tasks show no name.`}{" "}
        Confirm who they are before acting on this list.
      </Notice>
    );
  }
  const { detected } = clarification;
  return (
    <Notice tone="warning" title={detected < 2 ? "Only one voice was detected" : `${detected} voices were detected`}>
      {detected < 2
        ? "This app expects two people taking turns. If two people did speak, their voices may be too similar, or the recording too short, to tell apart, so owners cannot be trusted."
        : "This app supports two speakers. With more voices, owners may be attributed to the wrong person."}
    </Notice>
  );
}
