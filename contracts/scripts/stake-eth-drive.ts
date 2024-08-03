import hre from "hardhat";
import { parseEther } from "viem";
import { minimumUnstakeDelay } from "../config";

async function main() {
  const ethDriveAddress = "0x104a39a9efa89ff3987ebf8864d8a2876ccda940";
  const value = parseEther("0.1");

  const ethDrive = await hre.viem.getContractAt("EthDrive", ethDriveAddress);
  console.log("EthDrive deployed at:", ethDrive.address);

  const ethDriveAddStakeHash = await ethDrive.write.addStake(
    [minimumUnstakeDelay * 2],
    {
      value,
    }
  );
  console.log("EthDrive addStake hash:", ethDriveAddStakeHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
