import { task } from "hardhat/config";
import { parseEther } from "viem";

import { addresses } from "../shared/app/addresses";
import { isChainId } from "../shared/app/types";

task(
  "depositToCCIPTokenTransferor",
  "Deposits ETH into the EthDriveCCIPTokenTransferor contract"
)
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

    const { ethDriveCCIPTokenTransferor: ethDriveCCIPTokenTransferorAddress } =
      addresses[chainId];

    if (!ethDriveCCIPTokenTransferorAddress) {
      console.log(
        "EthDriveCCIPTokenTransferor address not found for chain ID:",
        chainId
      );
      return;
    }

    console.log(
      "ethDriveCCIPTokenTransferorAddress",
      ethDriveCCIPTokenTransferorAddress
    );
    console.log("ethAmount", value, "ETH");

    const [signer] = await hre.viem.getWalletClients();
    const ethDriveCCIPTokenTransferorDepositHash = await signer.sendTransaction(
      {
        // : ethDriveCCIPTokenTransferorAddress,
        to: ethDriveCCIPTokenTransferorAddress,
        value: ethAmount,
      }
    );

    console.log(
      "EthDriveCCIPTokenTransferor deposit hash:",
      ethDriveCCIPTokenTransferorDepositHash
    );
  });
