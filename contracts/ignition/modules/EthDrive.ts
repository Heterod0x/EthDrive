import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { erc4331EntryPointAddress, erc6551RegistryAddress } from "../../config";

const EthDriveModule = buildModule("EthDriveModule", (m) => {
  const deployer = m.getAccount(0);

  const accountImplementation = m.contract("EthDriveAccount", [
    erc4331EntryPointAddress,
  ]);

  const ethDrive = m.contract("EthDrive", [
    deployer,
    erc6551RegistryAddress,
    accountImplementation,
  ]);

  return { ethDrive };
});

export default EthDriveModule;
