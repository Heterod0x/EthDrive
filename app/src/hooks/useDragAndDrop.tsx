"use client";

import { useCallback, useState } from "react";
import { Address, Hex, encodeFunctionData } from "viem";

import { getChainIdFromPath } from "@/lib/chain";
import { findDirectory } from "@/lib/directory";
import { Directory } from "@/types/directory";
import { File as FileType } from "@/types/file";

import { ethDriveAccountAbi } from "../../../contracts/shared/app/abi";
import { addresses } from "../../../contracts/shared/app/addresses";
import { config } from "../../../contracts/shared/app/config";
import { ccipBnMAbi } from "../../../contracts/shared/app/external-abi";
import { ethDriveCCIPTokenTransferorAbi } from "../../../contracts/shared/app/optional-abi";
import { isChainId } from "../../../contracts/shared/app/types";
import {
  chainlinkCCIPBnMAddresses,
  sepoliaWETHAddress,
} from "../../../contracts/shared/external-contract";

export function useDragAndDrop(
  rootDirectory: Directory,
  handleTransactionAsDirectory: (callData: Hex) => void,
) {
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
        console.log("draggedFile", draggedFile);
        const sourceChainId = draggedFile.chainId?.toString();
        console.log("sourceChainId", sourceChainId);
        const destinationChainId =
          getChainIdFromPath(directoryPath)?.toString();
        console.log("destinationChainId", destinationChainId);
        if (!isChainId(sourceChainId) || !isChainId(destinationChainId)) {
          throw new Error("Invalid chain ID");
        }
        const destinationDirectory = findDirectory(
          rootDirectory,
          directoryPath.split("/").slice(1),
        );
        console.log("destinationDirectory", destinationDirectory);
        if (!destinationDirectory) {
          throw new Error("Destination directory not found");
        }
        if (!destinationDirectory.tokenBoundAccount) {
          throw new Error(
            "Destination directory does not have a token bound account",
          );
        }
        let callData = "";
        if (draggedFile.type == "native") {
          console.log("create execute call data for ETH transfer...");
          callData = encodeFunctionData({
            abi: ethDriveAccountAbi,
            functionName: "execute",
            args: [
              destinationDirectory.tokenBoundAccount as Address,
              BigInt(draggedFile.amount),
              "0x",
            ],
          });
        } else if (draggedFile.type == "weth") {
          const transferCallData = encodeFunctionData({
            abi: ccipBnMAbi,
            functionName: "transfer",
            args: [
              destinationDirectory.tokenBoundAccount as Address,
              BigInt(draggedFile.amount),
            ],
          });
          console.log("transferCallData", transferCallData);
          callData = encodeFunctionData({
            abi: ethDriveAccountAbi,
            functionName: "execute",
            args: [sepoliaWETHAddress, BigInt(0), transferCallData],
          });
        } else if (draggedFile.type == "ccip") {
          console.log("create execute call data for CCIP transfer...");
          if (sourceChainId == destinationChainId) {
            console.log("same chain transfer");
            const transferCallData = encodeFunctionData({
              abi: ccipBnMAbi,
              functionName: "transfer",
              args: [
                destinationDirectory.tokenBoundAccount as Address,
                BigInt(draggedFile.amount),
              ],
            });
            console.log("transferCallData", transferCallData);
            callData = encodeFunctionData({
              abi: ethDriveAccountAbi,
              functionName: "execute",
              args: [
                chainlinkCCIPBnMAddresses[
                  sourceChainId as keyof typeof chainlinkCCIPBnMAddresses
                ] as Address,
                BigInt(0),
                transferCallData,
              ],
            });
          } else {
            console.log("cross chain transfer");
            const approveCallData = encodeFunctionData({
              abi: ccipBnMAbi,
              functionName: "approve",
              args: [
                addresses[sourceChainId].ethDriveCCIPTokenTransferor as Address,
                BigInt(draggedFile.amount),
              ],
            });
            console.log("approveCallData", approveCallData);
            const transferTokensPayNativeCallData = encodeFunctionData({
              abi: ethDriveCCIPTokenTransferorAbi,
              functionName: "transferTokensPayNative",
              args: [
                config[destinationChainId].chainlinkCCIPChainSelecter,
                destinationDirectory.tokenBoundAccount as Address,
                chainlinkCCIPBnMAddresses[
                  sourceChainId as keyof typeof chainlinkCCIPBnMAddresses
                ] as Address,
                BigInt(draggedFile.amount),
              ],
            });
            console.log(
              "transferTokensPayNativeCallData",
              transferTokensPayNativeCallData,
            );
            callData = encodeFunctionData({
              abi: ethDriveAccountAbi,
              functionName: "executeBatch",
              args: [
                [
                  chainlinkCCIPBnMAddresses[
                    sourceChainId as keyof typeof chainlinkCCIPBnMAddresses
                  ] as Address,
                  addresses[sourceChainId]
                    .ethDriveCCIPTokenTransferor as Address,
                ],
                [BigInt(0), BigInt(0)],
                [approveCallData, transferTokensPayNativeCallData],
              ],
            });
          }
        }
        handleTransactionAsDirectory(callData as Hex);
        setDraggedFile(null);
      }
    },
    [draggedFile, rootDirectory],
  );

  return {
    draggedFile,
    handleDragStart,
    handleDragOver,
    handleFileDrop,
  };
}
