import { createPublicClient, defineChain, http } from "viem";
import {
  baseSepolia,
  celoAlfajores,
  fraxtal,
  modeTestnet,
  optimismSepolia,
  sepolia,
} from "viem/chains";

import { config } from "../../../contracts/shared/app/config";
import {
  ethDriveVirtualMainnetChainId,
  ethDriveVirtualMainnetRPC,
} from "../../../contracts/shared/tenderly";

export const virtualChain = defineChain({
  id: ethDriveVirtualMainnetChainId,
  name: "Tenderly Virtual",
  iconUrl: "/logo-tenderly-virtual-testnet.svg",
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

export const metalL2TestnetChain = defineChain({
  id: 1740,
  name: "Metal L2 Testnet",
  iconUrl: "/logo-metal-l2-testnet.svg",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.rpc.metall2.com"],
    },
  },
  testnet: true,
});

export const conduitChain = defineChain({
  id: 15830,
  name: "Conduit Drive Chain",
  iconUrl: "/logo.png",
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
  "11155420": createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  }),
  "84532": createPublicClient({
    chain: baseSepolia,
    transport: http(),
  }),
  "919": createPublicClient({
    chain: modeTestnet,
    transport: http(),
  }),
  "44787": createPublicClient({
    chain: celoAlfajores,
    transport: http(),
  }),
  "1740": createPublicClient({
    chain: metalL2TestnetChain,
    transport: http(),
  }),
  "252": createPublicClient({
    chain: fraxtal,
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
