import { ethers, network } from "hardhat";
import {
  chainlinkCCIPRouterAddresses,
  entryPointAddress,
  erc6551RegistryAddress,
  chainlinkLINKAddresses,
} from "../shared/external-contract";

import fs from "fs";
import path from "path";

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

interface Contract {
  name: string;
  address: string;
  abi: any;
}

async function deploy(name: string, args: any[] = []): Promise<Contract> {
  console.log(`Deploying ${name}...`);
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${name} deployed to:`, address);
  const abi = require(path.join(
    __dirname,
    `../artifacts/contracts/${name}.sol/${name}.json`
  )).abi;
  return { name, address, abi };
}

async function main() {
  const chainId = network.config.chainId?.toString();
  if (!chainId) {
    throw new Error("Chain ID is not set in Hardhat config file");
  }

  let blockNumber: number | undefined;

  if (!process.env.SKIP_CONFIG_UPDATE) {
    blockNumber = await ethers.provider.getBlockNumber();
  }

  const ethDriveAccountImplementation = await deploy("EthDriveAccount", [
    entryPointAddress,
  ]);

  const ethDrive = await deploy("EthDrive", [
    erc6551RegistryAddress,
    ethDriveAccountImplementation.address,
  ]);

  const ethDrivePaymaster = await deploy("EthDrivePaymaster", [
    entryPointAddress,
  ]);

  let ethDriveCCIPTokenTransferor: Contract | undefined;
  if (
    chainlinkCCIPRouterAddresses[
      chainId as keyof typeof chainlinkCCIPRouterAddresses
    ]
  ) {
    const ccipRouterAddress =
      chainlinkCCIPRouterAddresses[
        chainId as keyof typeof chainlinkCCIPRouterAddresses
      ];

    const linkAddress =
      chainlinkLINKAddresses[
        chainId as keyof typeof chainlinkCCIPRouterAddresses
      ];

    ethDriveCCIPTokenTransferor = await deploy("EthDriveCCIPTokenTransferor", [
      ccipRouterAddress,
      linkAddress,
      ethDrive.address,
    ]);
  }

  if (!process.env.SKIP_CONFIG_UPDATE) {
    const sharedDir = path.join(__dirname, "../shared");
    ensureDirExists(sharedDir);

    const subgraphDir = path.join(sharedDir, "subgraph");
    ensureDirExists(subgraphDir);

    const abiDir = path.join(subgraphDir, "abi");
    ensureDirExists(abiDir);

    for (const contract of [ethDrive]) {
      fs.writeFileSync(
        path.join(abiDir, `${contract.name}.json`),
        JSON.stringify(contract.abi, null, 2)
      );
    }

    const appDir = path.join(sharedDir, "app");
    ensureDirExists(appDir);

    const appAbiContent = `// prettier-ignore
export const ethDriveAbi = ${JSON.stringify(
      ethDrive.abi || [],
      null,
      2
    )} as const;

// prettier-ignore
export const ethDriveAccountAbi = ${JSON.stringify(
      ethDriveAccountImplementation.abi || [],
      null,
      2
    )} as const;
    
`;
    fs.writeFileSync(path.join(appDir, "abi.ts"), appAbiContent);

    if (chainId !== "31337") {
      const subgraphNetworkDir = path.join(subgraphDir, "network");
      ensureDirExists(subgraphNetworkDir);

      const subgraphNetworkConfig = {
        network: network.name,
        address: ethDrive.address,
        startBlock: blockNumber,
      };
      fs.writeFileSync(
        path.join(subgraphNetworkDir, `${chainId}.json`),
        JSON.stringify(subgraphNetworkConfig, null, 2)
      );

      const appAddressesPath = path.join(appDir, "addresses.ts");

      const existingAppAddresses = fs.existsSync(appAddressesPath)
        ? require(appAddressesPath).addresses // Import the existing addresses object
        : {};

      const updatedAppAddresses = {
        ...existingAppAddresses,
        [chainId]: {
          ethDrive: ethDrive.address,
          ethDrivePaymaster: ethDrivePaymaster.address,
          ethDriveCCIPTokenTransferor: ethDriveCCIPTokenTransferor
            ? ethDriveCCIPTokenTransferor.address
            : "",
        },
      };

      const appAddressesContent = `// prettier-ignore
export const addresses = ${JSON.stringify(
        updatedAppAddresses,
        null,
        2
      )} as const;
`;
      fs.writeFileSync(appAddressesPath, appAddressesContent);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
