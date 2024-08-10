"use client";

import { writeContract } from "@wagmi/core";
import { waitForTransactionReceipt } from "@wagmi/core";
import { switchChain } from "@wagmi/core";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useConfig, useReadContract } from "wagmi";

import { Button } from "@/components/ui/button";
import GasDepositManagerABI from "@/constants/abis/GasDepositManager.json";
import { useIsGasslessEnabled } from "@/hooks/useIsGaslessEnabled";
import { conduitChain } from "@/lib/chain";

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

  const [isGasslessEnabled, setIsGasslessEnabled] = useIsGasslessEnabled();

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
        setIsGasslessEnabled(true);
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

    setIsGasslessEnabled(nextChecked);
  }, []);

  const [newDepositAmount, setNewDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const isDepositButtonDisabled = useMemo(() => {
    const parsed = Number.parseFloat(newDepositAmount);
    return Number.isNaN(parsed) || parsed < 0;
  }, [newDepositAmount]);
  const onClickDeposit = useCallback(async () => {
    if (!isWorldIdVerified || !isGasslessEnabled) return;

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
    isGasslessEnabled,
    refetchDepositAmount,
  ]);

  return (
    <div className="pt-4 space-y-2">
      <WorldIDProver
        disabled={!address || verifying}
        checked={isWorldIdVerified && isGasslessEnabled}
        skipVerification={isWorldIdVerified!}
        verifying={verifying}
        address={address!}
        onProofGenerated={onWorldIDProofGenerated}
        onSwitchToggled={onGaslessSwitchToggled}
      />
      <div className="flex flex-col space-y-2">
        {isWorldIdVerified && isGasslessEnabled && (
          <>
            <div className="flex justify-between items-center">
              <span>Current Deposit:</span>
              {depositAmount !== null && depositAmount !== undefined && (
                <span>{ethers.formatUnits(depositAmount)} ETH</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Input
                type="number"
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
      </div>
    </div>
  );
}
