import { task } from "hardhat/config";
import { parseEther } from "viem";

import { addresses } from "../shared/app/addresses";
import { isChainId } from "../shared/app/types";

task("depositToPaymaster", "Deposits ETH into the EthDrivePaymaster contract")
  .addOptionalParam("value", "The amount of ETH to deposit", "0.1")
  .setAction(async (taskArgs, hre) => {
    const { value } = taskArgs;
    const ethAmount = parseEther(value);

    const _chainId = hre.network.config.chainId;
    const chainId = _chainId?.toString();
    if (!isChainId(chainId)) {
      console.log("Unsupported chain ID:", chainId);
      return;
    }

    const { ethDrivePaymaster: ethDrivePaymasterAddress } = addresses[chainId];
    console.log("ethDrivePaymasterAddress", ethDrivePaymasterAddress);
    console.log("ethAmount", value, "ETH");

    const ethDrivePaymaster = await hre.viem.getContractAt(
      "EthDrivePaymaster",
      ethDrivePaymasterAddress
    );
    const ethDrivePaymasterDepositHash = await ethDrivePaymaster.write.deposit({
      value: ethAmount,
    });
    console.log(
      "EthDrivePaymaster deposit hash:",
      ethDrivePaymasterDepositHash
    );
  });
