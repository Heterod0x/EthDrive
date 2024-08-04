import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { tenderlyVirtualTestnet } from "./shared/rpc";
import { defaultSignerPrivateKey } from "./shared/key";

const accounts = [process.env.PRIVATE_KEY || defaultSignerPrivateKey];

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: tenderlyVirtualTestnet,
      },
    },
    sepolia: {
      chainId: 11155111,
      url: "https://rpc.sepolia.org",
      accounts,
    },
  },
};

export default config;
