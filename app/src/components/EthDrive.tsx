"use client";

import { File, Folder } from "lucide-react";
import React, { useCallback, useState } from "react";
import {
  Address,
  Hex,
  encodeFunctionData,
  formatEther,
  toHex,
  zeroAddress,
} from "viem";
import { useAccount, useWalletClient } from "wagmi";

import { ExpandableDirectory } from "@/components/ExpandableDirectory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useChain } from "@/hooks/useChain";
import { useDirectory } from "@/hooks/useDirectory";
import { dummySignature, request } from "@/lib/alchemy";
import { getChainIdFromPath } from "@/lib/chain";
import { findDirectory } from "@/lib/directory";
import { File as FileType } from "@/types/file";

import {
  ethDriveAbi,
  ethDriveAccountAbi,
} from "../../../contracts/shared/app/abi";
import { entryPointAbi } from "../../../contracts/shared/app/external-abi";
import { isChainId } from "../../../contracts/shared/app/types";
import { entryPointAddress } from "../../../contracts/shared/external-contract";
import { CopyToClipboard } from "./CopyToClipboard";
import { DirectoryPathBreadcrumb } from "./DirectoryPathBreadcrumb";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function EthDrive({ path }: { path?: string }) {
  const {
    isConnected,
    chainId: connectedChainId,
    address: connectedAddress,
  } = useAccount();
  const { data: walletClient } = useWalletClient();

  const {
    rootDirectory,
    selectedDirectory,
    selectedDirectoryPath,
    selectedDirectoryChainId,
    connectedAddressDirectory,
    setSelectedDirectoryPath,
  } = useDirectory(path, connectedAddress);

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

  const handleDirectoryTransaction = useCallback(
    async (callData: Hex) => {
      console.log("callData", callData);
      const account = selectedDirectory.tokenBoundAccount as Address;
      console.log("account", account);

      if (selectedChainConfig?.isAccountAbstractionEnabled) {
        console.log("account abstraction is enabled");

        const nonce = await selectedChainPublicClient!.readContract({
          abi: ethDriveAccountAbi,
          address: account,
          functionName: "getNonce",
          args: [],
        });
        console.log("nonce", nonce);

        const latestBlock = await selectedChainPublicClient!.getBlock();
        console.log("latestBlock", latestBlock);

        const baseFeePerGas = latestBlock!.baseFeePerGas || BigInt(0);
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
          maxPriorityFeePerGas + maxPriorityFeePerGas / BigInt(10); // add 10% overhead;
        console.log(
          "adjustedMaxPriorityFeePerGas",
          adjustedMaxPriorityFeePerGas,
        );

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
          [partialUserOperation, entryPointAddress],
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
          [userOperation, entryPointAddress],
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
    },
    [
      selectedDirectory.tokenBoundAccount,
      selectedChainConfig,
      selectedChainPublicClient,
      ethDriveAccountAbi,
      selectedChainAddresses,
      dummySignature,
      walletClient,
      entryPointAbi,
      entryPointAddress,
    ],
  );

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

  const [draggedFile, setDraggedFile] = useState<FileType | null>(null);

  const handleDragStart =
    (file: FileType) => (event: React.DragEvent<HTMLDivElement>) => {
      setDraggedFile(file);
      event.dataTransfer.setData("text/plain", JSON.stringify(file));
    };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFileDrop = useCallback(
    (directoryPath: string) => {
      if (draggedFile) {
        const _chainId = getChainIdFromPath(directoryPath);
        if (selectedDirectoryChainId === _chainId) {
          const chainId = _chainId?.toString();
          if (isChainId(chainId)) {
            const directory = findDirectory(
              rootDirectory,
              directoryPath.split("/").slice(1),
            );
            if (directory && directory.tokenBoundAccount) {
              const callData = encodeFunctionData({
                abi: ethDriveAccountAbi,
                functionName: "execute",
                args: [
                  directory.tokenBoundAccount as Address,
                  BigInt(draggedFile.amount),
                  "0x",
                ],
              });
              handleDirectoryTransaction(callData);
            }
          }
        }
        setDraggedFile(null);
      }
    },
    [draggedFile, selectedDirectoryChainId, rootDirectory, ethDriveAccountAbi],
  );

  return (
    <div className="flex flex-col h-screen">
      <Header
        openCreateDirectoryDialog={() => {
          setIsCreateDirectoryModalOpen(true);
        }}
      />

      <div className="flex flex-grow">
        <Sidebar>
          <div>
            <p className="font-medium mb-2">All Directories</p>
            <ExpandableDirectory
              directory={rootDirectory}
              onSelected={setSelectedDirectoryPath}
              onFileDrop={handleFileDrop}
            />
          </div>
          {isConnected && (
            <div>
              <p className="font-medium mb-2">My Directories</p>
              <ExpandableDirectory
                directory={connectedAddressDirectory}
                onSelected={setSelectedDirectoryPath}
                onFileDrop={handleFileDrop}
              />
            </div>
          )}
        </Sidebar>

        <div className="p-4 w-full">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <DirectoryPathBreadcrumb
                selectedDirectoryPath={selectedDirectoryPath}
                setSelectedDirectoryPath={setSelectedDirectoryPath}
              />
              <CopyToClipboard
                text={`${
                  typeof window !== "undefined" && window.location.origin
                }/${selectedDirectoryPath}`}
              />
            </div>
            <Button
              disabled={selectedDirectory.depth < 2}
              onClick={() => {
                const callData = encodeFunctionData({
                  abi: ethDriveAccountAbi,
                  functionName: "execute",
                  args: [zeroAddress, BigInt(0), "0x"],
                });
                handleDirectoryTransaction(callData);
              }}
            >
              Test Transaction
            </Button>
          </div>
          <div className="mb-4 space-y-2">
            {selectedDirectory.tokenBoundAccount && (
              <div className="flex items-center">
                <p className="text-sm">
                  Token Bound Account: {selectedDirectory.tokenBoundAccount}
                </p>
                <CopyToClipboard text={selectedDirectory.tokenBoundAccount} />
              </div>
            )}
            {selectedDirectory.holder && (
              <div className="flex items-center">
                <p className="text-sm">
                  Token Holder: {selectedDirectory.holder}
                </p>
                <CopyToClipboard text={selectedDirectory.holder} />
              </div>
            )}
          </div>
          <div>
            {selectedDirectoryPath == selectedDirectory.path &&
              selectedDirectory.subdirectories.map((directory) => (
                <Card
                  key={directory.path}
                  className="flex items-center p-2 cursor-pointer w-full mb-2"
                  onClick={() => setSelectedDirectoryPath(directory.path)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleFileDrop(directory.path)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  <span>{directory.name}</span>
                </Card>
              ))}
            {selectedDirectoryPath == selectedDirectory.path &&
              selectedDirectory.files.map((file, i) => (
                <React.Fragment key={`files_${i}`}>
                  {file.amount !== "0" && (
                    <Card
                      className="flex items-center p-2 cursor-pointer w-full mb-2"
                      draggable
                      onDragStart={handleDragStart(file)}
                    >
                      <File className="h-4 w-4 mr-2" />
                      {file.type == "native" && (
                        <span>{formatEther(BigInt(file.amount))} ETH</span>
                      )}
                    </Card>
                  )}
                </React.Fragment>
              ))}
          </div>
        </div>
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
