import { error, transaction } from "frames.js/core";
import { createFrames } from "frames.js/next";
import { Hex, encodeFunctionData } from "viem";

import { ethDriveAbi } from "../../../../../contracts/shared/app/abi";
import { addresses } from "../../../../../contracts/shared/app/addresses";
import { config } from "../../../../../contracts/shared/app/config";
import { ChainId } from "../../../../../contracts/shared/app/types";
import { chainPublicClients } from "../../../lib/chain";

function getChainIdFromChainPathName(chainPathName: string) {
  for (const [key, value] of Object.entries(config)) {
    if (value.path === chainPathName) {
      return key as ChainId;
    }
  }
  return null;
}

const frames = createFrames({
  basePath: "/",
});

export const POST = frames(async (ctx) => {
  const inputText = ctx.message?.inputText;
  if (!inputText) {
    return error("inputText is required");
  }
  const parts = inputText.split("/");
  const chainPathName = parts.shift();
  if (!chainPathName) {
    return error("chainPathName not found");
  }
  const path = parts.join("/") as Hex;
  const chainId = getChainIdFromChainPathName(chainPathName);
  if (!chainId) {
    return error("chainId not found for: " + chainPathName);
  }
  const isCreated = await chainPublicClients[chainId].readContract({
    abi: ethDriveAbi,
    address: addresses[chainId].ethDrive,
    functionName: "isCreated",
    args: [path],
  });
  if (isCreated) {
    return error("Directory already exists: " + inputText);
  }
  const calldata = encodeFunctionData({
    abi: ethDriveAbi,
    functionName: "createDirectory",
    args: [path],
  });
  return transaction({
    chainId: `eip155:${chainId}`,
    method: "eth_sendTransaction",
    params: {
      abi: ethDriveAbi,
      to: addresses[chainId].ethDrive,
      data: calldata,
      value: "0",
    },
  });
});
