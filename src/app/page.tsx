import { AudioLines } from "lucide-react";

import { App } from "@/components/app/app";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <AudioLines className="size-4" />
          </span>
          <span className="text-sm font-medium tracking-tight">Commitments from recordings</span>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Every quote is checked against the transcript before it is shown
        </p>
      </header>
      <main className="flex flex-1 flex-col py-10">
        <App />
      </main>
      <footer className="border-t border-foreground/10 pt-4 text-xs text-muted-foreground text-pretty">
        Speech is transcribed by Deepgram and read by DeepSeek. Uploads are deleted right after
        processing; nothing is stored. Owners and deadlines are never inferred: if it was not said,
        it is not shown.
      </footer>
    </div>
  );
}
