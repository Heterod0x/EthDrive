import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const EthDriveModule = buildModule("LockModule", (m) => {
  const deployer = m.getAccount(0);

  const ethDrive = m.contract("EthDrive", [deployer]);

  return { ethDrive };
});

export default EthDriveModule;
