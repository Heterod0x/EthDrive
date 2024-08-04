import hre from "hardhat";
import { entryPointAddress, erc6551RegistryAddress } from "../config";

import fs from "fs";
import path from "path";

interface ContractInfo {
  name: string;
  address: string;
  abi: any;
}

interface Network {
  chainId: string;
  name: string;
  blockNumber: number;
}

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function deploy(name: string, args: any[] = []): Promise<ContractInfo> {
  console.log(`Deploying ${name}...`);
  const contract = await hre.viem.deployContract(name, args);
  console.log(`${name} deployed to:`, contract.address);
  const abi = contract.abi;
  return { name, address: contract.address, abi };
}

async function updateDeployedConfig(
  contracts: ContractInfo[],
  network: Network
) {
  console.log("Updating deployed config...");

  const dir = path.join(__dirname, "../config/deployed", network.chainId);
  ensureDirExists(dir);
  contracts.forEach((contract) => {
    const deployed = {
      address: contract.address,
      abi: contract.abi,
      blockNumber: network.blockNumber,
    };
    fs.writeFileSync(
      path.join(dir, `${contract.name}.json`),
      JSON.stringify(deployed, null, 2)
    );
  });

  console.log("Deployed config updated!");
}

async function createSubgraphConfig(
  contracts: ContractInfo[],
  network: Network
) {
  console.log("Updating subgraph config...");

  const ethDrive = contracts.find((c) => c.name === "EthDrive");
  if (ethDrive) {
    console.log("Target contract found", ethDrive.name);

    const subgraphDir = path.join(
      __dirname,
      "../config/deployed",
      network.chainId,
      "subgraph"
    );
    ensureDirExists(subgraphDir);

    const subgraphNetworkConfig = {
      network: network.name,
      ethDriveAddress: ethDrive.address,
      startBlock: network.blockNumber,
    };
    fs.writeFileSync(
      path.join(subgraphDir, "network.json"),
      JSON.stringify(subgraphNetworkConfig, null, 2)
    );

    const subgraphAbiDir = path.join(subgraphDir, "abi");
    ensureDirExists(subgraphAbiDir);

    fs.writeFileSync(
      path.join(subgraphAbiDir, `${ethDrive.name}.json`),
      JSON.stringify(ethDrive.abi, null, 2)
    );
    console.log("Subgraph config updated!");
  } else {
    console.log("Target contract not found");
  }
}

async function main() {
  const deployedContracts: ContractInfo[] = [];

  let network: Network | undefined;

  if (!process.env.SKIP_CONFIG_UPDATE) {
    const _chainId = hre.network.config.chainId;
    if (!_chainId) {
      throw new Error("Chain ID is not set in Hardhat config file");
    }
    const chainId = _chainId.toString();
    const name = hre.network.name;
    const publicNetwork = await hre.viem.getPublicClient();
    const _blockNumber = await publicNetwork.getBlockNumber();
    const blockNumber = Number(_blockNumber);
    network = { chainId, name, blockNumber };
  }

  const ethDriveAccountImplementation = await deploy("EthDriveAccount", [
    entryPointAddress,
  ]);
  deployedContracts.push(ethDriveAccountImplementation);

  const ethDrive = await deploy("EthDrive", [
    erc6551RegistryAddress,
    ethDriveAccountImplementation.address,
  ]);
  deployedContracts.push(ethDrive);

  const ethDrivePaymaster = await deploy("EthDrivePaymaster", [
    entryPointAddress,
  ]);
  deployedContracts.push(ethDrivePaymaster);

  console.log("Deployed contracts:", deployedContracts);

  if (!process.env.SKIP_CONFIG_UPDATE && network) {
    await updateDeployedConfig(deployedContracts, network);

    await createSubgraphConfig(deployedContracts, network);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
