import { AudioLines } from "lucide-react";

import { App } from "@/components/app/app";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-border py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center bg-ink text-background">
            <AudioLines className="size-4" />
          </span>
          <span className="font-heading text-[17px] font-semibold tracking-tight text-ink">
            Commitments from recordings
          </span>
        </div>
        <p className="hidden text-[13px] text-muted-foreground sm:block">
          Every quote is checked against the transcript before it is shown
        </p>
      </header>
      <main className="flex flex-1 flex-col py-10">
        <App />
      </main>
      {/* The one dark band on the page, as in the brand's section rhythm. */}
      <footer className="mb-6 bg-ink-deep px-8 py-6 text-xs text-white/70 text-pretty">
        Speech is transcribed by Deepgram and read by DeepSeek. Uploads are deleted right after
        processing; nothing is stored. Owners and deadlines are never inferred: if it was not said,
        it is not shown.
      </footer>
    </div>
  );
}
