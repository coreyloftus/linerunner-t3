import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "../components/ui/toaster";
import { Providers } from "~/components/Providers";
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
        <Providers>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
