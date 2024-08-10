import { cookieToInitialState } from "@account-kit/core";
import "@rainbow-me/rainbowkit/styles.css";
import { fetchMetadata } from "frames.js/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";

import { alchemyConfig } from "@/lib/alchemy";
import { baseUrl } from "@/lib/url";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "ETHDrive",
  description: "This is ETHDrive website",
};

export async function generateMetadata() {
  return {
    ...metadata,
    other: {
      ...(await fetchMetadata(`${baseUrl}/frames`)),
    },
  };
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    alchemyConfig,
    headers().get("cookie") ?? undefined,
  );

  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gradient-to-tr from-white via-white to-violet-100 bg-no-repeat`}
      >
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
