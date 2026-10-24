"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { api } from "~/trpc/react";

const PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-accent px-4 text-base font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { status } = useSession();
  const { data: share, isLoading } = api.share.byToken.useQuery(
    { token },
    { enabled: status !== "loading", refetchOnWindowFocus: false },
  );

  const join = api.share.join.useMutation({
    onSuccess: ({ project, source, scene }) => {
      const params = new URLSearchParams({ project, source, scene });
      router.push(`/?${params.toString()}`);
    },
  });

  const loading = status === "loading" || isLoading;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          LineRunner
        </p>

        {loading ? (
          <p className="py-10 text-sm text-muted-foreground">Loading…</p>
        ) : !share ? (
          <div className="space-y-5 pt-6">
            <h1 className="font-display text-2xl font-semibold">This link is off</h1>
            <p className="text-sm text-muted-foreground">
              Ask the person who sent it for a new one.
            </p>
            <Link href="/" className={PRIMARY}>
              Open LineRunner
            </Link>
          </div>
        ) : (
          <div className="space-y-6 pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {share.isOwner ? "Your show" : `${share.ownerName} shared`}
              </p>
              <h1 className="font-display text-3xl font-semibold leading-tight">
                {share.project}
              </h1>
              <p className="font-script text-sm text-muted-foreground">
                {share.sceneCount} {share.sceneCount === 1 ? "scene" : "scenes"}
              </p>
            </div>

            {status === "unauthenticated" ? (
              <button
                type="button"
                onClick={() => void signIn("google", { callbackUrl: `/join/${token}` })}
                className={PRIMARY}
              >
                Sign in to join
              </button>
            ) : (
              <button
                type="button"
                onClick={() => join.mutate({ token })}
                disabled={join.isPending}
                className={PRIMARY}
              >
                {join.isPending
                  ? "Joining…"
                  : share.isOwner || share.joined
                    ? "Open show"
                    : "Join"}
              </button>
            )}
            {join.error && (
              <p className="text-sm text-curtain">{join.error.message}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
