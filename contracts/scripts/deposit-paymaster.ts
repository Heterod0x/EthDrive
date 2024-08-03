import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  const ethDrivePaymasterAddress = "0x7f0d42e65c10f57fb70677e23b57bb54251b41af";
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
