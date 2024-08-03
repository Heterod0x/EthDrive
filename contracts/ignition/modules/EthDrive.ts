import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { erc6551RegistryAddress } from "../../config";

const EthDriveModule = buildModule("EthDriveModule", (m) => {
  const deployer = m.getAccount(0);

  const implementation = m.contract("ERC6551Account");

  const ethDrive = m.contract("EthDrive", [
    deployer,
    erc6551RegistryAddress,
    implementation,
  ]);

  return { ethDrive };
});

export default EthDriveModule;
