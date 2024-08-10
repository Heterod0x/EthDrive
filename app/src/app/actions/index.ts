"use server";

import { kv } from "@vercel/kv";
import { fromHex } from "viem";

import { request as alchemyRequest } from "@/lib/alchemy";
import { chainPublicClients } from "@/lib/chain";

import { ethDriveAccountAbi } from "../../../../contracts/shared/app/abi";
import { config } from "../../../../contracts/shared/app/config";
import { ChainId } from "../../../../contracts/shared/app/types";

export const updateAlchemyGasManagerWhiteList = async () => {};

export const withdrawIfUserOperationIsFundedInAlchemy = async (
  chainId: ChainId,
  uoHash: string,
) => {
  const isAlreadyProcessed = await kv.get(uoHash);
  if (isAlreadyProcessed) {
    throw new Error("Already processed");
  }
  const alchemyGasManagerPolicyId = config[chainId].alchemyGasManagerPolicyId;
  if (!alchemyGasManagerPolicyId) {
    throw new Error("Alchemy Gas Manager Policy ID is not defined");
  }
  const res = await fetch(
    `https://manage.g.alchemy.com/api/gasManager/policy/${alchemyGasManagerPolicyId}/sponsorships`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.ALCHEMY_ACCESS_TOKEN
          ? `Bearer ${process.env.ALCHEMY_ACCESS_TOKEN}`
          : "",
      },
    },
  );
  const {
    data: { sponsorships },
  } = await res.json();
  const matched = sponsorships.find((sponsorship: any) => {
    return (
      // included pending data because alchemy data sync is slow for this data
      // in later part, check if user operation is confirmed or not, so including pending data is ok
      (sponsorship.status === "MINED" || sponsorship.status === "PENDING") &&
      sponsorship.uoHash === uoHash
    );
  });
  if (!matched) {
    throw new Error("No matched sponsorship found");
  }
  const account = await chainPublicClients[chainId].readContract({
    address: matched.sender,
    abi: ethDriveAccountAbi,
    functionName: "owner",
  });
  const getUserOperationReceipt = await alchemyRequest(
    config[chainId].alchemyChainName,
    "eth_getUserOperationReceipt",
    [uoHash],
  );
  if (getUserOperationReceipt.error) {
    throw new Error(getUserOperationReceipt.error.message);
  }
  const feeBn =
    fromHex(getUserOperationReceipt.result.receipt.gasUsed, "bigint") *
    fromHex(getUserOperationReceipt.result.receipt.effectiveGasPrice, "bigint");
  const response = await fetch("http://localhost:3000/api/world_id/withdraw", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account,
      fee: feeBn.toString(),
    }),
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error("Failed to withdraw");
  }
  await kv.set(uoHash, true);
  return;
};
