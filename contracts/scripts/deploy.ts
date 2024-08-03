import hre from "hardhat";
import { entryPointAddress, erc6551RegistryAddress } from "../config";

async function main() {
  const ethDriveAccountImplementation = await hre.viem.deployContract(
    "EthDriveAccount",
    [entryPointAddress]
  );
  console.log(
    "EthDriveAccount implementation deployed to:",
    ethDriveAccountImplementation.address
  );

  const ethDrive = await hre.viem.deployContract("EthDrive", [
    erc6551RegistryAddress,
    ethDriveAccountImplementation.address,
  ]);
  console.log("EthDrive deployed to:", ethDrive.address);

  const ethDrivePaymaster = await hre.viem.deployContract("EthDrivePaymaster", [
    entryPointAddress,
  ]);

  console.log("EthDrivePaymaster deployed to:", ethDrivePaymaster.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
