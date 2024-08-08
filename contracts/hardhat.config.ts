import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import * as tenderly from "@tenderly/hardhat-tenderly";

import {
  ethDriveVirtualMainnetChainId,
  ethDriveVirtualMainnetRPC,
} from "./shared/tenderly";
import { defaultSignerPrivateKey } from "./shared/key";

import "./tasks/depositToCCIPTokenTransferor";
import "./tasks/depositToPaymaster";
import "./tasks/syncWorldIdRoots";

require('dotenv').config();

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
    "optimism-sepolia": {
      chainId: 11155420,
      url: "https://sepolia.optimism.io",
      accounts,
    },
    "base-sepolia": {
      chainId: 84532,
      url: "https://sepolia.base.org",
      accounts,
    },
    conduit: {
      url: process.env.CONDUIT_RPC,
      accounts: accounts,
    }
  },
  tenderly: {
    project: "hackathon",
    username: "taijusanagi",
  },
};

export default config;
