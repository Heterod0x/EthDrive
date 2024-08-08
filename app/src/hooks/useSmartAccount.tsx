"use client";

import {
  SmartAccountClient,
  SmartContractAccount,
  baseSepolia,
  createSmartAccountClient,
  getEntryPoint,
  optimismSepolia,
  sepolia,
  toSmartContractAccount,
} from "@alchemy/aa-core";
import { useCallback, useEffect, useState } from "react";
import { Address, Hex, PublicClient, WalletClient, http, toHex } from "viem";

import { dummySignature, getRpcUrl, request } from "@/lib/alchemy";

import { config } from "../../../contracts/shared/app/config";
import { isChainId } from "../../../contracts/shared/app/types";

export function useSmartAccount(
  chainId?: number,
  accountAddress?: Address,
  publicClient?: PublicClient,
  walletClient?: WalletClient,
) {
  const [smartAccount, setSmartAccount] = useState<SmartContractAccount>();
  const [smartAccountClient, setSmartAccountClient] =
    useState<SmartAccountClient>();

  useEffect(() => {
    (async function () {
      const _chainId = chainId?.toString();
      if (
        !isChainId(_chainId) ||
        !accountAddress ||
        !publicClient ||
        !walletClient
      ) {
        return;
      }
      const { alchemyChainName } = config[_chainId];
      let chain;
      if (alchemyChainName === "eth-sepolia") {
        chain = sepolia;
      } else if (alchemyChainName === "opt-sepolia") {
        chain = optimismSepolia;
      } else if (alchemyChainName === "base-sepolia") {
        chain = baseSepolia;
      } else {
        return;
      }
      const rpcUrl = getRpcUrl(alchemyChainName);
      const transport = http(rpcUrl) as any; // to bypass type check
      const entryPoint = await getEntryPoint(chain, { version: "0.6.0" });
      const smartAccount = await toSmartContractAccount({
        source: "EthDriveAccount",
        transport,
        chain,
        entryPoint,
        accountAddress,
        getDummySignature: () => dummySignature,
        signMessage: async ({ message }: { message: { raw: Hex } }) => {
          console.log("smartContractAccount: signMessage", message);
          return await walletClient.signMessage({
            message,
          } as any); // to bypass type check for account
        },
      } as any); // set any because we only implement requrired method to make it work
      setSmartAccount(smartAccount);
      const smartAccountClient = createSmartAccountClient({
        transport,
        chain,
      });
      setSmartAccountClient(smartAccountClient);
    })();
  }, [chainId, accountAddress, publicClient, walletClient]);

  // Default fee estimator for Sepolia is not working well, so added custom fee estimator
  const getFeeEstimateForSmartAccountTransaction = useCallback(async () => {
    if (!publicClient) {
      return { maxfeePerGas: "0x", maxPriorityFeePerGas: "0x" };
    }
    console.log("alchemy-aa-client-override: feeEstimator");
    const latestBlock = await publicClient.getBlock();
    console.log("latestBlock", latestBlock);
    const baseFeePerGas = latestBlock.baseFeePerGas || BigInt(0);
    console.log("baseFeePerGas", baseFeePerGas);
    const adjustedBaseFeePerGas = baseFeePerGas + baseFeePerGas / BigInt(4); // add 25% overhead;
    console.log("adjustedBaseFeePerGas", adjustedBaseFeePerGas);
    const { result: maxPriorityFeePerGasHex } = await request(
      "eth-sepolia",
      "rundler_maxPriorityFeePerGas",
      [],
    );
    const maxPriorityFeePerGas = BigInt(maxPriorityFeePerGasHex);
    console.log("maxPriorityFeePerGas", maxPriorityFeePerGas);
    const adjustedMaxPriorityFeePerGas =
      maxPriorityFeePerGas + maxPriorityFeePerGas / BigInt(4); // add 25% overhead;
    console.log("adjustedMaxPriorityFeePerGas", adjustedMaxPriorityFeePerGas);
    const maxFeePerGas =
      adjustedBaseFeePerGas + BigInt(adjustedMaxPriorityFeePerGas);
    console.log("maxFeePerGas", maxFeePerGas);
    return {
      maxFeePerGas: toHex(maxFeePerGas),
      maxPriorityFeePerGas: toHex(adjustedMaxPriorityFeePerGas),
    };
  }, [publicClient]);

  return {
    smartAccount,
    smartAccountClient,
    getFeeEstimateForSmartAccountTransaction,
  };
}
