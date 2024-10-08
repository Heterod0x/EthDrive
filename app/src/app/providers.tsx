"use client";

import { AlchemyClientState } from "@account-kit/core";
import { AlchemyAccountProvider } from "@account-kit/react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import {
  baseSepolia,
  celoAlfajores,
  fraxtal,
  modeTestnet,
  optimismSepolia,
  sepolia,
} from "viem/chains";
import { WagmiProvider } from "wagmi";

import { PluginsProvider } from "@/hooks/usePlugins";
import { alchemyConfig } from "@/lib/alchemy";
import { conduitChain, metalL2TestnetChain, virtualChain } from "@/lib/chain";

(modeTestnet as any).iconUrl = "/logo-mode-testnet.svg";
(celoAlfajores as any).iconUrl = "/logo-celo-alfajores.svg";
(fraxtal as any).iconUrl = "/logo-fraxtal-mainnet.svg";

export const wagmiConfig = getDefaultConfig({
  appName: "ETHDrive",
  projectId:
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
    "3a8170812b534d0ff9d794f19a901d64",
  chains: [
    sepolia,
    optimismSepolia,
    baseSepolia,
    modeTestnet,
    celoAlfajores,
    metalL2TestnetChain,
    fraxtal,
    virtualChain,
    conduitChain,
  ],
  ssr: true,
});

export const queryClient = new QueryClient();

export function Providers({
  initialState,
  children,
}: {
  initialState?: AlchemyClientState;
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AlchemyAccountProvider
            config={alchemyConfig}
            queryClient={queryClient}
            initialState={initialState}
          >
            <PluginsProvider>{children}</PluginsProvider>
          </AlchemyAccountProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
