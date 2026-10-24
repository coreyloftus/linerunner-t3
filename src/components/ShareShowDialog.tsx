"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FaXmark, FaLink, FaCopy, FaArrowUpFromBracket } from "react-icons/fa6";
import { api } from "~/trpc/react";
import { toast } from "./ui/use-toast";

interface ShareShowDialogProps {
  projectName: string;
  // "owner" manages the link; "shared" is a recipient who can make a copy
  mode: "owner" | "shared";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopied?: (projectName: string) => void;
}

const PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50";
const SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50";

export function ShareShowDialog({
  projectName,
  mode,
  open,
  onOpenChange,
  onCopied,
}: ShareShowDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl focus:outline-none md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {mode === "owner" ? "Share" : "Shared with you"}
              </p>
              <Dialog.Title className="truncate font-display text-xl font-semibold">
                {projectName}
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="-mr-2 -mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <FaXmark className="h-4 w-4" />
            </Dialog.Close>
          </div>
          {mode === "owner" ? (
            <OwnerPanel projectName={projectName} />
          ) : (
            <RecipientPanel
              projectName={projectName}
              onCopied={(name) => {
                onOpenChange(false);
                onCopied?.(name);
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function OwnerPanel({ projectName }: { projectName: string }) {
  const utils = api.useUtils();
  const input = { projectName };
  const { data: share, isLoading } = api.share.getMine.useQuery(input, {
    refetchOnWindowFocus: false,
  });
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const setShare = (next: typeof share) => utils.share.getMine.setData(input, next);
  const create = api.share.create.useMutation({ onSuccess: setShare });
  const newLink = api.share.newLink.useMutation({ onSuccess: setShare });
  const turnOff = api.share.turnOffLink.useMutation({ onSuccess: setShare });
  const remove = api.share.removeMember.useMutation({ onSuccess: setShare });
  const busy =
    create.isPending || newLink.isPending || turnOff.isPending || remove.isPending;

  const link =
    share?.token && typeof window !== "undefined"
      ? `${window.location.origin}/join/${share.token}`
      : null;

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copied" });
  };

  const nativeShare = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: projectName, text: `Run lines for ${projectName}`, url: link });
    } catch {
      // The user closed the share sheet
    }
  };

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-5">
      {link ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Anyone with this link can join. They can practice, not edit.
          </p>
          <div className="truncate rounded-lg border border-border bg-surface-raised px-3 py-3 font-script text-sm" data-testid="share-link">
            {link}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void copy()} className={`${PRIMARY} flex-1`}>
              <FaCopy className="h-3.5 w-3.5" />
              Copy
            </button>
            {canNativeShare && (
              <button type="button" onClick={() => void nativeShare()} className={`${SECONDARY} flex-1`}>
                <FaArrowUpFromBracket className="h-3.5 w-3.5" />
                Send
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {share
              ? "The link is off. No one new can join."
              : "Send your cast a link. They can practice, not edit, and they see your changes."}
          </p>
          <button
            type="button"
            onClick={() => create.mutate(input)}
            disabled={busy}
            className={`${PRIMARY} w-full`}
          >
            <FaLink className="h-3.5 w-3.5" />
            {share ? "Turn link on" : "Create link"}
          </button>
        </div>
      )}

      {share && (
        <div>
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Joined · {share.members.length}
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>
          {share.members.length === 0 ? (
            <p className="py-2 font-script text-sm text-muted-foreground">No one yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {share.members.map((member) => (
                <li key={member} className="flex items-center justify-between gap-2 pl-3">
                  <span className="truncate text-sm">{member}</span>
                  <button
                    type="button"
                    onClick={() => remove.mutate({ ...input, memberEmail: member })}
                    disabled={busy}
                    className="min-h-[44px] flex-shrink-0 px-3 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={`Remove ${member}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {share?.token && (
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => newLink.mutate(input)}
              disabled={busy}
              className={`${SECONDARY} flex-1`}
            >
              New link
            </button>
            <button
              type="button"
              onClick={() => turnOff.mutate(input)}
              disabled={busy}
              className={`${SECONDARY} flex-1`}
            >
              Turn off link
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            A new link ends the old one. People who joined keep access until you remove them.
          </p>
        </div>
      )}
    </div>
  );
}

function RecipientPanel({
  projectName,
  onCopied,
}: {
  projectName: string;
  onCopied: (projectName: string) => void;
}) {
  const utils = api.useUtils();
  const copy = api.share.copyToMine.useMutation({
    onSuccess: async ({ project }) => {
      await utils.scriptData.getAll.invalidate({ dataSource: "firestore" });
      toast({ title: "Copied", description: `"${project}" is in Your Scripts.` });
      onCopied(project);
    },
    onError: (error) => toast({ title: "Couldn't copy", description: error.message }),
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You see the owner&apos;s latest version. Make your own copy to edit it.
      </p>
      <button
        type="button"
        onClick={() => copy.mutate({ projectName })}
        disabled={copy.isPending}
        className={`${PRIMARY} w-full`}
      >
        <FaCopy className="h-3.5 w-3.5" />
        {copy.isPending ? "Copying…" : "Make my own copy"}
      </button>
    </div>
  );
}
