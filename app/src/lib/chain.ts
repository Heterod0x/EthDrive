import { createPublicClient, defineChain, http } from "viem";
import { baseSepolia, optimismSepolia, sepolia } from "viem/chains";

import { config } from "../../../contracts/shared/app/config";
import {
  ethDriveVirtualMainnetChainId,
  ethDriveVirtualMainnetRPC,
} from "../../../contracts/shared/tenderly";

export const virtualChain = defineChain({
  id: ethDriveVirtualMainnetChainId,
  name: "Virtual",
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

export const conduitChain = defineChain({
  id: 15830,
  name: "Conduit",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CUSTOM_ROLLUP_RPC!],
    },
  },
  testnet: true,
});

export const chainPublicClients = {
  "9999999": createPublicClient({
    chain: virtualChain,
    transport: http(),
  }),
  "11155111": createPublicClient({
    chain: sepolia,
    transport: http(),
  }),
  "84532": createPublicClient({
    chain: baseSepolia,
    transport: http(),
  }),
  "11155420": createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  }),
  "15830": createPublicClient({
    chain: conduitChain,
    transport: http(),
  }),
};

export const getChainIdFromPath = (path: string) => {
  const network = path.split("/")[1];
  const idToChainIdMap = Object.entries(config).reduce(
    (acc, [chainId, details]) => {
      acc[details.path] = chainId;
      return acc;
    },
    {} as { [key: string]: string },
  );
  const chainId = idToChainIdMap[network];
  if (!chainId) {
    return undefined;
  }
  return Number(chainId);
};
