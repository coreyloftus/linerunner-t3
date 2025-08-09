import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "../components/ui/toaster";
import { Providers } from "~/components/Providers";
import { Suspense } from "react";
export const metadata = {
  title: "LineRunner",
  description: "LineRunner",
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
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </Providers>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
