import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { tenderlyVirtualTestnet } from "./config";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: tenderlyVirtualTestnet,
      },
    },
  },
};

export default config;
