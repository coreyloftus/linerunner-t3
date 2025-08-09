"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";
import { ScriptContext } from "~/app/context";
import { useContext, useEffect } from "react";
import Image from "next/image";

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
        trigger={
          <div className="rounded-md border border-gray-300 bg-gray-50/50 px-3 py-2 shadow-lg transition-all duration-200 hover:bg-gray-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[44px] flex items-center">
            {session.user?.email ?? "User"}
          </div>
        }
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

  return (
    <DropdownMenu
      className="flex w-full min-w-[200px]"
      trigger={
        <div className="inline-flex h-9 flex-grow items-center justify-center whitespace-nowrap rounded-md border border-stone-200 px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:cursor-pointer hover:bg-yellow-400 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 min-h-[44px] dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-800 dark:hover:text-stone-50 dark:focus-visible:ring-stone-300">
          Sign In
        </div>
      }
    >
      <DropdownMenuItem
        className="w-full whitespace-nowrap bg-gray-50 p-2 hover:bg-yellow-400 transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[44px]"
        onClick={() => signIn("google")}
      >
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          className="mr-2 h-5 w-5"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          ></path>
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          ></path>
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          ></path>
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          ></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
        Sign in with Google
      </DropdownMenuItem>
      <DropdownMenuItem
        className="w-full whitespace-nowrap bg-gray-50 p-2 hover:bg-yellow-400 transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[44px]"
        onClick={() => signIn("discord")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 126.644 96"
          className="mr-2 h-5 w-5"
        >
          <defs>
            <style>{`.cls-1{fill:#5865f2;}`}</style>
          </defs>
          <path
            id="Discord-Symbol-Blurple"
            className="cls-1"
            d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,2.6519,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z"
          />
        </svg>
        Sign in with Discord
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
