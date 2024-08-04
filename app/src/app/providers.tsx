"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";

import { defineChain } from "viem";
import { QueryClient } from "@tanstack/react-query";
import { sepolia } from "viem/chains";

import {
  ethDriveVirtualMainnetChainId,
  ethDriveVirtualMainnetRPC,
} from "../../../contracts/shared/tenderly";

export const apolloClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
});

const virtual = defineChain({
  id: ethDriveVirtualMainnetChainId,
  name: "Virtual",
  iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  nativeCurrency: {
    decimals: 18,
    name: "Virtual Ether",
    symbol: "VETH",
  },
  rpcUrls: {
    default: {
      http: [ethDriveVirtualMainnetRPC],
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "ETHDrive",
  projectId:
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
    "3a8170812b534d0ff9d794f19a901d64",
  chains: [sepolia, virtual],
  ssr: true,
});

export const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
