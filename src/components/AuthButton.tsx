"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";

export const AuthButton = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    console.log(session);
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          Signed in as {session.user?.name ?? session.user?.email}
        </span>
        <Button onClick={() => signOut()} variant="outline">
          Sign out
        </Button>
      </div>
    );
  }

  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
};
