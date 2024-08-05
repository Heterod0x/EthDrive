import { createPublicClient, defineChain, http } from "viem";

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

export const virtualClient = createPublicClient({
  chain: virtualChain,
  transport: http(),
});
