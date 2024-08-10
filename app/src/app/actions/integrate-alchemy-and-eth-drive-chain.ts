"use server";

import { kv } from "@vercel/kv";
import { Address, fromHex } from "viem";

import { request as alchemyRequest } from "@/lib/alchemy";
import { chainPublicClients } from "@/lib/chain";
import { baseUrl } from "@/lib/url";

import { ethDriveAccountAbi } from "../../../../contracts/shared/app/abi";
import { config } from "../../../../contracts/shared/app/config";
import { ChainId } from "../../../../contracts/shared/app/types";

export const updateAlchemyGasManagerWhiteList = async (
  chainId: ChainId,
  account: Address,
  fee: string,
) => {
  const alchemyGasManagerPolicyIdWithWithdraw =
    config[chainId].alchemyGasManagerPolicyIdWithWithdraw;
  if (!alchemyGasManagerPolicyIdWithWithdraw) {
    throw new Error("Alchemy Gas Manager Policy ID is not defined");
  }
  const signer = await chainPublicClients[chainId].readContract({
    address: account,
    abi: ethDriveAccountAbi,
    functionName: "owner",
  });
  const verifyRes = await fetch(`${baseUrl}/api/world_id/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account: signer,
      fee,
    }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.ok) {
    throw new Error("Failed to verify");
  }
  const policyRes = await fetch(
    `https://manage.g.alchemy.com/api/gasManager/policy/${alchemyGasManagerPolicyIdWithWithdraw}`,
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
  const policydata = await policyRes.json();
  if (policydata.error) {
    throw new Error(policydata.error.message);
  }
  let senderAllowlist = [];
  senderAllowlist.push(account);
  if (policydata.data.policy.rules.senderAllowlist) {
    for (const allowedAddress of policydata.data.policy.rules.senderAllowlist) {
      if (allowedAddress !== account) {
        const verifyRes = await fetch(`${baseUrl}/api/world_id/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account: allowedAddress,
            fee,
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.ok) {
          senderAllowlist.push(allowedAddress);
        }
      }
    }
  }
  const updatedPolicy = {
    policyName: policydata.data.policy.policyName,
    rules: {
      ...policydata.data.policy.rules,
      senderAllowlist,
    },
  };
  const updatePolicyRes = await fetch(
    `https://manage.g.alchemy.com/api/gasManager/policy/${alchemyGasManagerPolicyIdWithWithdraw}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.ALCHEMY_ACCESS_TOKEN
          ? `Bearer ${process.env.ALCHEMY_ACCESS_TOKEN}`
          : "",
      },
      body: JSON.stringify(updatedPolicy),
    },
  );
  const updatePolicyData = await updatePolicyRes.json();
  if (updatePolicyData.error) {
    throw new Error(updatePolicyData.error.message);
  }
};

export const withdrawIfUserOperationIsFundedInAlchemy = async (
  chainId: ChainId,
  uoHash: string,
) => {
  const isAlreadyProcessed = await kv.get(uoHash);
  if (isAlreadyProcessed) {
    throw new Error("Already processed");
  }
  const alchemyGasManagerPolicyIdWithWithdraw =
    config[chainId].alchemyGasManagerPolicyIdWithWithdraw;
  if (!alchemyGasManagerPolicyIdWithWithdraw) {
    throw new Error("Alchemy Gas Manager Policy ID is not defined");
  }
  const policySponsorshipsRes = await fetch(
    `https://manage.g.alchemy.com/api/gasManager/policy/${alchemyGasManagerPolicyIdWithWithdraw}/sponsorships`,
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
  const sponsorshipsData = await policySponsorshipsRes.json();
  if (sponsorshipsData.error) {
    throw new Error(sponsorshipsData.error.message);
  }
  const sponsorships = sponsorshipsData.data.sponsorships;
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
  const signer = await chainPublicClients[chainId].readContract({
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
  const response = await fetch(`${baseUrl}/api/world_id/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account: signer,
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
