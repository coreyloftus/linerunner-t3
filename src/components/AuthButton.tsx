"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";
import { ScriptContext } from "~/app/context";
import { useContext, useEffect } from "react";

export const AuthButton = () => {
  const { data: session, status } = useSession();
  const { setIsAdmin } = useContext(ScriptContext);

  // Set admin status in useEffect to avoid setState during render
  useEffect(() => {
    if (session?.user?.email === "coreyloftus@gmail.com") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [session?.user?.email, setIsAdmin]);

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
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
