"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";

export const AuthButton = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    console.log(session);
    return (
      <DropdownMenu
        trigger={session.user?.email ?? "User"}
        className="rounded-md border border-gray-300 bg-gray-50/50 px-3 py-2 shadow-lg transition-colors hover:bg-gray-50"
      >
        <DropdownMenuItem
          className="bg-gray-50/50 p-3 hover:cursor-pointer hover:bg-gray-50"
          onClick={() => signOut()}
        >
          <div className="flex h-full w-full items-center justify-center">
            <span>Sign out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenu>
    );
  }

  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
};
