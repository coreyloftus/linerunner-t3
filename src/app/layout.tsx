import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";

import { TRPCReactProvider } from "~/trpc/react";
import { ScriptProvider } from "./context";

export const metadata = {
  title: "LineRunner T3",
  description: "LineRunner T3",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <ScriptProvider>{children}</ScriptProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
