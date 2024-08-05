"use client";

import React, { useState } from "react";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAccount, useWalletClient } from "wagmi";

import { Address, encodeFunctionData, toHex, zeroAddress } from "viem";

import { ExpandableDirectory } from "@/components/ExpandableDirectory";
import { Card } from "@/components/ui/card";

import { request, dummySignature } from "@/lib/alchemy";
import { entryPointAbi } from "../../../contracts/shared/app/external-abi";
import { entryPointAddress } from "../../../contracts/shared/external-contract";

import {
  ethDriveAbi,
  ethDriveAccountAbi,
} from "../../../contracts/shared/app/abi";
import { useDirectory } from "@/hooks/useDirectory";
import { useChain } from "@/hooks/useChain";
import { DirectoryPathBreadcrumb } from "./DirectoryPathBreadcrumb";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { CopyToClipboard } from "./CopyToClipboard";

export function EthDrive({ path }: { path?: string }) {
  const { chainId: connectedChainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const {
    rootDirectory,
    selectedDirectory,
    selectedDirectoryPath,
    selectedDirectoryChainId,
    setSelectedDirectoryPath,
  } = useDirectory(path);

  console.log("selectedDirectoryPath", selectedDirectoryPath);

  const {
    chainAddresses: connectedChainAddresses,
    // chainConfig: connectedChainConfig,
    // chainPublicClient: connectedChainPublicClient,
  } = useChain(connectedChainId);
  const {
    chainAddresses: selectedChainAddresses,
    chainConfig: selectedChainConfig,
    chainPublicClient: selectedChainPublicClient,
  } = useChain(selectedDirectoryChainId);

  const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] =
    useState(false);
  const [createDirectoryName, setCreateDirectoryName] = useState("");

  async function handleDirectoryTransaction() {
    const account = selectedDirectory.tokenBoundAccount as Address;
    console.log("account", account);
    // TODO: use actual callData
    const callData = encodeFunctionData({
      abi: ethDriveAccountAbi,
      functionName: "execute",
      args: [zeroAddress, BigInt(0), "0x"],
    });
    console.log("callData", callData);
    if (selectedChainConfig!.isAccountAbstractionEnabled) {
      console.log("account abstraction is enabled");
      const nonce = await selectedChainPublicClient!.readContract({
        abi: ethDriveAccountAbi,
        address: account,
        functionName: "getNonce",
        args: [],
      });
      console.log("nonce", nonce);
      // https://www.alchemy.com/blog/user-operation-fee-estimation
      const latestBlock = await selectedChainPublicClient!.getBlock();
      console.log("latestBlock", latestBlock);
      const baseFeePerGas = latestBlock!.baseFeePerGas || BigInt(0);
      console.log("baseFeePerGas", baseFeePerGas);
      const adjustedBaseFeePerGas = baseFeePerGas + baseFeePerGas / BigInt(4); // add 25% overhead;
      console.log("adjustedBaseFeePerGas", adjustedBaseFeePerGas);

      const { result: maxPriorityFeePerGasHex } = await request(
        "eth-sepolia",
        "rundler_maxPriorityFeePerGas",
        []
      );
      const maxPriorityFeePerGas = BigInt(maxPriorityFeePerGasHex);
      console.log("maxPriorityFeePerGas", maxPriorityFeePerGas);

      const adjustedMaxPriorityFeePerGas =
        maxPriorityFeePerGas + maxPriorityFeePerGas / BigInt(10); // add 10% overhead;
      console.log("adjustedMaxPriorityFeePerGas", adjustedMaxPriorityFeePerGas);
      const maxFeePerGas =
        adjustedBaseFeePerGas + BigInt(adjustedMaxPriorityFeePerGas);
      console.log("maxFeePerGas", maxFeePerGas);
      const partialUserOperation = {
        sender: account,
        nonce: toHex(nonce),
        initCode: "0x",
        callData: callData,
        maxFeePerGas: toHex(maxFeePerGas),
        maxPriorityFeePerGas: toHex(adjustedMaxPriorityFeePerGas),
        paymasterAndData: selectedChainAddresses!.ethDrivePaymaster,
        signature: dummySignature,
      };
      console.log("partialUserOperation", partialUserOperation);
      const estimateUserOperationGasRes = await request(
        selectedChainConfig!.alchemyChainName,
        "eth_estimateUserOperationGas",
        [partialUserOperation, entryPointAddress]
      );
      console.log("estimateUserOperationGasRes", estimateUserOperationGasRes);
      if (estimateUserOperationGasRes.error) {
        throw new Error(estimateUserOperationGasRes.error);
      }
      const { callGasLimit, preVerificationGas, verificationGasLimit } =
        estimateUserOperationGasRes.result;
      console.log("callGasLimit", callGasLimit);
      console.log("preVerificationGas", preVerificationGas);
      console.log("verificationGasLimit", verificationGasLimit);
      const userOperation = {
        ...partialUserOperation,
        callGasLimit,
        preVerificationGas,
        verificationGasLimit,
      } as any;
      console.log("userOperation", userOperation);
      const userOpHash = await selectedChainPublicClient!.readContract({
        abi: entryPointAbi,
        address: entryPointAddress,
        functionName: "getUserOpHash",
        args: [userOperation],
      });
      console.log("userOpHash", userOpHash);
      const signature = await walletClient!.signMessage({
        message: { raw: userOpHash },
      });
      console.log("signature", signature);
      userOperation.signature = signature;
      console.log("userOperation", userOperation);
      const sendUserOperationRes = await request(
        selectedChainConfig!.alchemyChainName,
        "eth_sendUserOperation",
        [userOperation, entryPointAddress]
      );
      console.log("sendUserOperationRes", sendUserOperationRes);
      if (sendUserOperationRes.error) {
        throw new Error(sendUserOperationRes.error);
      }
    } else {
      console.log("account abstraction is not enabled");
      const txHash = await walletClient!.sendTransaction({
        to: account,
        data: callData,
      });
      console.log("txHash", txHash);
    }
  }

  async function handleUserTransaction() {
    const callData = encodeFunctionData({
      abi: ethDriveAbi,
      functionName: "createDirectory",
      args: [createDirectoryName],
    });
    console.log("callData", callData);
    const txHash = await walletClient!.sendTransaction({
      to: connectedChainAddresses!.ethDrive,
      data: callData,
    });
    console.log("txHash", txHash);
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        openCreateDirectoryDialog={() => {
          setIsCreateDirectoryModalOpen(true);
        }}
      />

      <div className="flex flex-grow overflow-hidden">
        <Sidebar>
          <ExpandableDirectory
            directory={rootDirectory}
            onSelected={setSelectedDirectoryPath}
          />
        </Sidebar>

        <ScrollArea className="p-4 w-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <DirectoryPathBreadcrumb
                selectedDirectoryPath={selectedDirectoryPath}
                setSelectedDirectoryPath={setSelectedDirectoryPath}
              />
              <CopyToClipboard
                text={`${window.location.origin}/${selectedDirectoryPath}`}
              />
            </div>
            <Button
              disabled={selectedDirectory.depth < 2}
              onClick={handleDirectoryTransaction}
            >
              Test Transaction
            </Button>
          </div>
          <div>
            {selectedDirectoryPath == selectedDirectory.path &&
              selectedDirectory.subdirectories.map((directory) => (
                <Card
                  key={directory.path}
                  className="flex items-center p-2 cursor-pointer w-full mb-2"
                  onClick={() => setSelectedDirectoryPath(directory.path)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  <span>{directory.name}</span>
                </Card>
              ))}
          </div>
        </ScrollArea>
      </div>

      <Dialog
        open={isCreateDirectoryModalOpen}
        onOpenChange={setIsCreateDirectoryModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Directory</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter directory name"
            value={createDirectoryName}
            onChange={(e) => setCreateDirectoryName(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDirectoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUserTransaction}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
