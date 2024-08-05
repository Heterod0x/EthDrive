import { createPublicClient, defineChain, http } from "viem";
import { sepolia } from "viem/chains";

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
  "9999999": createPublicClient({
    chain: virtualChain,
    transport: http(),
  }),
  "11155111": createPublicClient({
    chain: sepolia,
    transport: http(),
  }),
};
