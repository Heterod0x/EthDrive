import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  const ethDrivePaymasterAddress = "0xad237c6505b0c1258709fa19fdcbf6c9d2509235";
  const value = parseEther("0.1");

  const ethDrivePaymaster = await hre.viem.getContractAt(
    "EthDrivePaymaster",
    ethDrivePaymasterAddress
  );
  console.log("EthDrivePaymaster deployed at:", ethDrivePaymaster.address);

  const ethDrivePaymasterDepositHash = await ethDrivePaymaster.write.deposit({
    value,
  });
  console.log("EthDrivePaymaster deposit hash:", ethDrivePaymasterDepositHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
