import hre from "hardhat";
import {
  entryPointAddress,
  erc6551RegistryAddress,
} from "../shared/external-contract";

import fs from "fs";
import path from "path";

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function deploy(name: string, args: any[] = []) {
  console.log(`Deploying ${name}...`);
  const contract = await hre.viem.deployContract(name, args);
  console.log(`${name} deployed to:`, contract.address);
  const abi = contract.abi;
  return { name, address: contract.address, abi };
}

async function main() {
  let blockNumber: number | undefined;

  if (!process.env.SKIP_CONFIG_UPDATE) {
    const publicNetwork = await hre.viem.getPublicClient();
    const _blockNumber = await publicNetwork.getBlockNumber();
    blockNumber = Number(_blockNumber);
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

  if (!process.env.SKIP_CONFIG_UPDATE) {
    const _chainId = hre.network.config.chainId;
    if (!_chainId) {
      throw new Error("Chain ID is not set in Hardhat config file");
    }
    const chainId = _chainId.toString();

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
export const ethDrivePaymasterAbi = ${JSON.stringify(
      ethDrivePaymaster.abi || [],
      null,
      2
    )} as const;
`;
    fs.writeFileSync(path.join(appDir, "abi.ts"), appAbiContent);

    if (chainId !== "31337") {
      const subgraphNetworkDir = path.join(subgraphDir, "network");
      ensureDirExists(subgraphNetworkDir);

      const subgraphNetworkConfig = {
        network: hre.network.name,
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
