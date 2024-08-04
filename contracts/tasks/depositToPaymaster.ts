import { task } from "hardhat/config";
import { parseEther } from "viem";

task("depositToPaymaster", "Deposits ETH into the EthDrivePaymaster contract")
  .addParam("paymaster", "The address of the EthDrivePaymaster contract")
  .addOptionalParam("value", "The amount of ETH to deposit", "0.1")
  .setAction(async (taskArgs, hre) => {
    const { paymaster, value } = taskArgs;
    const ethAmount = parseEther(value);

    const ethDrivePaymaster = await hre.viem.getContractAt(
      "EthDrivePaymaster",
      paymaster
    );
    console.log("EthDrivePaymaster:", ethDrivePaymaster.address);

    const ethDrivePaymasterDepositHash = await ethDrivePaymaster.write.deposit({
      value: ethAmount,
    });
    console.log(
      "EthDrivePaymaster deposit hash:",
      ethDrivePaymasterDepositHash
    );
  });
