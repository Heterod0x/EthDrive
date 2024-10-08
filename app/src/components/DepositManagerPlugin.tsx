"use client";

import { writeContract } from "@wagmi/core";
import { waitForTransactionReceipt } from "@wagmi/core";
import { switchChain } from "@wagmi/core";
import { ethers } from "ethers";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useAccount, useConfig, useReadContract } from "wagmi";

import { Button } from "@/components/ui/button";
import GasDepositManagerABI from "@/constants/abis/GasDepositManager.json";
import { usePlugins } from "@/hooks/usePlugins";
import { conduitChain } from "@/lib/chain";
import { baseUrl } from "@/lib/url";

import { WorldIDProver } from "./WorldIDProver";
import { Input } from "./ui/input";

const GAS_DEPOSIT_MANAGER = process.env.NEXT_PUBLIC_GAS_DEPOSIT_MANAGER_ADDRESS;

const splitProofs = (proof: string) => {
  const abi = ethers.AbiCoder.defaultAbiCoder();

  return abi
    .decode(
      ["uint256[8]"], // encode as address array
      proof,
    )[0]
    .map((x: any) => BigInt(x));
};

export function DepositManagerPlugin() {
  const { address } = useAccount();
  const config = useConfig();

  console.log("debug::address", address);

  const { plugins, setPlugins } = usePlugins();

  const { data: rawIsWorldIdVerified, refetch: refetchIsWorldIdVerified } =
    useReadContract({
      abi: GasDepositManagerABI,
      chainId: conduitChain.id,
      address: GAS_DEPOSIT_MANAGER as `0x${string}`,
      functionName: "verified",
      args: [address],
    });
  const isWorldIdVerified = rawIsWorldIdVerified === true;

  const { data: rawDepositAmount, refetch: refetchDepositAmount } =
    useReadContract({
      abi: GasDepositManagerABI,
      chainId: conduitChain.id,
      address: GAS_DEPOSIT_MANAGER as `0x${string}`,
      functionName: "deposited",
      args: [address],
    });
  const depositAmount = rawDepositAmount as bigint;

  console.log("debug::depositAmount", depositAmount);

  const syncPromiseRef = useRef<Promise<Response> | null>(null);
  const onVerificationStart = useCallback(() => {
    console.log("calling /api/world_id/sync");

    syncPromiseRef.current = fetch(`${baseUrl}/api/world_id/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => {
        console.log("World ID synced", res);
        return res;
      })
      .catch((err) => {
        console.error("failed to World ID roots sync", err);
        throw new err();
      });
  }, []);

  const [verifying, setVerifying] = useState(false);
  const onWorldIDProofGenerated = useCallback(
    async (proof: any) => {
      console.log(
        "debug::onWorldIDProofGenerated",
        isWorldIdVerified,
        address,
        proof,
      );

      if (isWorldIdVerified || !address) return;

      try {
        setVerifying(true);
        await switchChain(config, { chainId: conduitChain.id });

        await syncPromiseRef.current;

        const txHash = await writeContract(config, {
          abi: GasDepositManagerABI,
          chainId: conduitChain.id,
          address: GAS_DEPOSIT_MANAGER as `0x${string}`,
          functionName: "registerAddress",
          args: [
            address!.substring(2),
            proof.merkle_root,
            proof.nullifier_hash,
            splitProofs(proof.proof),
          ],
        });

        console.log("debug::tx sent", txHash);

        const receipt = await waitForTransactionReceipt(config, {
          chainId: conduitChain.id,
          hash: txHash,
        });

        if (receipt.status === "reverted") {
          throw new Error("transaction reverted");
        }

        console.log("debug::receipt", receipt);

        refetchIsWorldIdVerified();
        setPlugins((prev) => ({
          ...prev,
          isCrosschainGasSubsidiaryEnabled: true,
        }));
      } catch (error) {
        console.error(error);
      } finally {
        setVerifying(false);
      }
    },
    [config, address, isWorldIdVerified],
  );

  const onGaslessSwitchToggled = useCallback((nextChecked: boolean) => {
    console.log("debug::onGaslessSwitchToggled", nextChecked);
    setPlugins((prev) => ({
      ...prev,
      isCrosschainGasSubsidiaryEnabled: nextChecked,
    }));
  }, []);

  const [newDepositAmount, setNewDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const isDepositButtonDisabled = useMemo(() => {
    const parsed = Number.parseFloat(newDepositAmount);
    return Number.isNaN(parsed) || parsed < 0;
  }, [newDepositAmount]);
  const onClickDeposit = useCallback(async () => {
    if (!isWorldIdVerified || !plugins.isCrosschainGasSubsidiaryEnabled) return;

    try {
      setIsDepositing(true);

      await switchChain(config, { chainId: conduitChain.id });

      const txHash = await writeContract(config, {
        abi: GasDepositManagerABI,
        chainId: conduitChain.id,
        address: GAS_DEPOSIT_MANAGER as `0x${string}`,
        functionName: "deposit",
        args: [address],
        value: ethers.parseUnits(newDepositAmount),
      });

      console.log("debug::tx sent", txHash);

      const receipt = await waitForTransactionReceipt(config, {
        chainId: conduitChain.id,
        hash: txHash,
      });

      if (receipt.status === "reverted") {
        throw new Error("transaction reverted");
      }

      refetchDepositAmount();
      setNewDepositAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  }, [
    newDepositAmount,
    config,
    isWorldIdVerified,
    plugins.isCrosschainGasSubsidiaryEnabled,
    refetchDepositAmount,
  ]);

  return (
    <div className="pt-4 space-y-2">
      <WorldIDProver
        disabled={!address || verifying}
        checked={plugins.isCrosschainGasSubsidiaryEnabled}
        skipVerification={isWorldIdVerified!}
        verifying={verifying}
        address={address!}
        onProofGenerated={onWorldIDProofGenerated}
        onSwitchToggled={onGaslessSwitchToggled}
        onVerificationStart={onVerificationStart}
      />
      <div className="flex flex-col space-y-2">
        {plugins.isCrosschainGasSubsidiaryEnabled && (
          <>
            <p className="mt-4 font-medium">
              Cross-chain Gas Subsidiary Dashboard
            </p>
            <div className="flex justify-between items-center text-sm">
              <span>Current Deposit:</span>
              {depositAmount !== null && depositAmount !== undefined && (
                <span>{ethers.formatUnits(depositAmount)} ETH</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Input
                type="number"
                placeholder="deposit amount"
                min={0}
                value={newDepositAmount}
                onChange={(e) => {
                  setNewDepositAmount(e.target.value);
                }}
                style={{ width: "150px" }}
              />
              <Button
                disabled={isDepositButtonDisabled || isDepositing}
                onClick={onClickDeposit}
              >
                {isDepositing ? "Depositing..." : "Deposit"}
              </Button>
            </div>
          </>
        )}
        <div className="pt-4">
          <p className="font-medium mb-1">
            Conduit EthDrive chain ETH can be bridged here.
          </p>
          <Link
            href="https://superhack-test-v4369l32sl-0876b1631555927c.testnets.rollbridge.app/"
            target="_blank"
            className="underline text-sm text-blue-500"
          >
            https://superhack-test-v4369l32sl-0876b1631555927c.testnets.rollbridge.app/
          </Link>
        </div>
      </div>
    </div>
  );
}
