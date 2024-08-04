import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import * as tenderly from "@tenderly/hardhat-tenderly";

import {
  ethDriveVirtualMainnetChainId,
  ethDriveVirtualMainnetRPC,
} from "./shared/tenderly";
import { defaultSignerPrivateKey } from "./shared/key";

import "./tasks/depositToPaymaster";

tenderly.setup({ automaticVerifications: true });

const accounts = [process.env.PRIVATE_KEY || defaultSignerPrivateKey];

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: ethDriveVirtualMainnetRPC,
      },
    },
    virtual: {
      chainId: ethDriveVirtualMainnetChainId,
      url: ethDriveVirtualMainnetRPC,
      accounts,
    },
    sepolia: {
      chainId: 11155111,
      url: "https://rpc.sepolia.org",
      accounts,
    },
  },
  tenderly: {
    project: "hackathon",
    username: "taijusanagi",
  },
};

export default config;
