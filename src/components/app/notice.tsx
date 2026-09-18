import { cn } from "cn";
import { Ban, CircleX, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const TONES = {
  neutral: { icon: Ban, className: "" },
  warning: {
    icon: TriangleAlert,
    className:
      "border-pending-line bg-pending-soft text-pending *:data-[slot=alert-description]:text-pending/90",
  },
  error: {
    icon: CircleX,
    className:
      "border-cancelled-line bg-cancelled-soft text-cancelled *:data-[slot=alert-description]:text-cancelled/90",
  },
};

/** A refusal, a warning or a failure, with an optional next step. */
export function Notice({
  tone,
  title,
  children,
  action,
}: {
  tone: keyof typeof TONES;
  title: string;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  const { icon: Icon, className } = TONES[tone];
  return (
    <Alert className={cn("px-4 py-3", className)}>
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{children}</p>
        {action && (
          <Button size="sm" onClick={action.onClick} className="mt-3 w-fit">
            {action.label}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
