import { createPublicClient, defineChain, http } from "viem";
import { baseSepolia, sepolia } from "viem/chains";

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

export const chainPublicClients = {
  "84532": createPublicClient({
    chain: baseSepolia,
    transport: http(),
  }),
  "9999999": createPublicClient({
    chain: virtualChain,
    transport: http(),
  }),
  "11155111": createPublicClient({
    chain: sepolia,
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
