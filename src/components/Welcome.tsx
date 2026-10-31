"use client";

import { signIn } from "next-auth/react";
import { FaPlus } from "react-icons/fa6";
import { Button } from "./ui/button";

const PRIMARY =
  "h-12 w-full gap-2 rounded-full bg-accent px-6 text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 sm:w-auto";
const SECONDARY =
  "h-12 w-full rounded-full bg-foreground/[0.06] px-6 text-base font-medium text-foreground hover:bg-muted sm:w-auto";

function Masthead() {
  return (
    <div className="mb-3 flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-border" />
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        LineRunner
      </p>
      <span className="h-px w-10 bg-border" />
    </div>
  );
}

// Signed-out pitch: sign in, or try the demo show
export function SignedOutWelcome({ onTryDemo }: { onTryDemo?: () => void }) {
  return (
    <div className="mx-auto max-w-md px-6 text-center">
      <Masthead />
      <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
        Know <span className="italic text-accent">every</span> line.
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
        Add your script, pick your part, and run lines with a partner that
        never gets tired.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={() => signIn("google")} className={PRIMARY}>
          Sign in with Google
        </Button>
        {onTryDemo && (
          <Button variant="ghost" onClick={onTryDemo} className={SECONDARY}>
            Try a demo
          </Button>
        )}
      </div>
    </div>
  );
}

// First stop for a signed-in user with no shows yet
export function NewUserWelcome({ onAddScript }: { onAddScript: () => void }) {
  return (
    <div className="mx-auto max-w-md px-6 text-center">
      <Masthead />
      <h1 className="text-4xl font-bold leading-tight tracking-tight">
        Let&apos;s get your <span className="italic text-accent">script</span>{" "}
        in.
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
        Paste a scene or upload a file. You can fix names before you save.
      </p>
      <div className="mt-8 flex justify-center">
        <Button onClick={onAddScript} className={PRIMARY}>
          <FaPlus className="h-4 w-4" />
          Add a script
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Shows shared with you appear here too.
      </p>
    </div>
  );
}
