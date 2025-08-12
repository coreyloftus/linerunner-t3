"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";
import { ScriptProvider } from "~/app/context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ScriptProvider>{children}</ScriptProvider>
    </SessionProvider>
  );
}
