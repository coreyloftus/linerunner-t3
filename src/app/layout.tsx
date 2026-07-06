import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Fraunces, Courier_Prime } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "../components/ui/toaster";
import { Providers } from "~/components/Providers";
import { Suspense } from "react";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-courier-prime",
});

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
    <html
      lang="en"
      className={`${GeistSans.variable} ${fraunces.variable} ${courierPrime.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved theme before first paint to avoid a light-mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("linerunner-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
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
