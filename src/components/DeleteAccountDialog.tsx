"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
}: DeleteAccountDialogProps) {
  const [typed, setTyped] = useState("");
  const deleteAccount = api.account.delete.useMutation({
    onSuccess: () => void signOut({ callbackUrl: "/" }),
  });
  const ready = typed.trim() === "DELETE" && !deleteAccount.isPending;

  const handleOpenChange = (next: boolean) => {
    if (deleteAccount.isPending) return;
    if (!next) {
      setTyped("");
      deleteAccount.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl focus:outline-none">
          <Dialog.Title className="font-display text-xl font-semibold">
            Delete your account?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            This deletes your shows, melodies, and settings for{" "}
            <span className="font-medium text-foreground">{email}</span>, and
            the shows you shared. You can&apos;t undo it.{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy
            </Link>
          </Dialog.Description>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) deleteAccount.mutate({ confirm: "DELETE" });
            }}
          >
            <label className="block text-sm" htmlFor="delete-confirm">
              Type <span className="font-script font-bold">DELETE</span> to
              confirm
            </label>
            <Input
              id="delete-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="min-h-[44px] border-border bg-surface-raised text-base"
            />
            {deleteAccount.error && (
              <p
                role="alert"
                className="rounded-md border border-curtain/40 bg-curtain/10 px-3 py-2 text-sm text-curtain"
              >
                {deleteAccount.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[44px]"
                  disabled={deleteAccount.isPending}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={!ready}
                className="min-h-[44px] bg-curtain text-white hover:bg-curtain/90"
              >
                {deleteAccount.isPending ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
