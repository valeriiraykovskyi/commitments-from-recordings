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
      "border-amber-200 bg-amber-50 text-amber-900 *:data-[slot=alert-description]:text-amber-900/80",
  },
  error: {
    icon: CircleX,
    className:
      "border-destructive/20 bg-destructive/5 text-destructive *:data-[slot=alert-description]:text-destructive/90",
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
          <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2 w-fit">
            {action.label}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
