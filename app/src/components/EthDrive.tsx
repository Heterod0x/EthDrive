"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Folder, Plus, User } from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useConfig,
} from "wagmi";

import { readContract } from "@wagmi/core";

import { Address, encodeFunctionData, toHex, zeroAddress } from "viem";

import { ethDriveAbi } from "@/lib/abi/eth-drive";
import { buildRecursiveDirectoryQuery } from "@/lib/query";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Directory as DirectoryType } from "@/types/directory";

import { Directory } from "@/components/Directory";
import { Card } from "@/components/ui/card";
import { ethDriveAccountAbi } from "@/lib/abi/eth-drive-account";

import {
  ethDriveAddress,
  entryPointAddress,
  ethDrivePaymasterAddress,
} from "@/lib/address";

import { request } from "@/lib/alchemy";
import { dummySignature } from "@/lib/constant";
import { entryPointAbi } from "@/lib/abi/entry-point";

const MAX_DEPTH = 5;

export function EthDrive({ path }: { path: string }) {
  const config = useConfig();
  const { writeContract } = useWriteContract();
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { data } = useQuery(gql(buildRecursiveDirectoryQuery(MAX_DEPTH)));
  const [directories, setDirectries] = useState<DirectoryType[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<DirectoryType>();
  const segments = useMemo(() => {
    if (!selectedDirectory) {
      return [];
    }
    return selectedDirectory.path.split("/").filter((segment) => segment);
  }, [selectedDirectory]);

  const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] =
    useState(false);
  const [createDirectoryName, setCreateDirectoryName] = useState("");

  useEffect(() => {
    if (data) {
      console.log("data", data);
      setDirectries(data.directories);
    }
  }, [data]);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <Image src="/logo.png" alt="logo" width="32" height="32" />
            <h1 className="text-2xl font-semibold">EthDrive</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          {isConnected && (
            <React.Fragment>
              <Button onClick={() => setIsCreateDirectoryModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
              <User
                className="h-8 w-8 cursor-pointer"
                onClick={() => {
                  disconnect();
                }}
              />
            </React.Fragment>
          )}
          {!isConnected && (
            <Button
              onClick={() => {
                if (!openConnectModal) {
                  throw new Error("openConnectModal is not defined");
                }
                openConnectModal();
              }}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        <div className="w-64 border-r">
          <div className="h-full p-4">
            {directories.map((directory) => (
              <Directory
                key={directory.path}
                directory={directory}
                onSelected={setSelectedDirectory}
              />
            ))}
          </div>
        </div>

        <ScrollArea className="p-4 w-full">
          <div className="flex justify-between items-center mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                {segments.map((segment, i) => {
                  return (
                    <React.Fragment key={`breadcrumb_${i}`}>
                      {i > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                      <BreadcrumbItem>
                        <BreadcrumbPage>{segment}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
            {selectedDirectory && (
              <Button
                onClick={async () => {
                  if (!chainId) {
                    throw new Error("chainId is not defined");
                  }
                  if (!walletClient) {
                    throw new Error("walletClient is not defined");
                  }
                  if (!publicClient) {
                    throw new Error("publicClient is not defined");
                  }
                  const sender = selectedDirectory.tokenBountAccount as Address;
                  const nonce = await readContract(config, {
                    abi: ethDriveAccountAbi,
                    address: sender,
                    functionName: "getNonce",
                    args: [],
                  });
                  // TODO: use actual callData
                  const callData = encodeFunctionData({
                    abi: ethDriveAccountAbi,
                    functionName: "execute",
                    args: [zeroAddress, BigInt(0), "0x"],
                  });
                  const latestBlock = await publicClient.getBlock();
                  const baseFeePerGas = latestBlock.baseFeePerGas || BigInt(0);
                  const { result: maxPriorityFeePerGas } = await request(
                    "eth-sepolia",
                    "rundler_maxPriorityFeePerGas",
                    []
                  );
                  const maxFeePerGas =
                    baseFeePerGas + BigInt(maxPriorityFeePerGas);
                  const partialUserOperation = {
                    sender,
                    nonce: toHex(nonce),
                    initCode: "0x",
                    callData: callData,
                    maxFeePerGas: toHex(maxFeePerGas),
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                    paymasterAndData: ethDrivePaymasterAddress,
                    signature: dummySignature,
                  };
                  const {
                    result: {
                      callGasLimit,
                      preVerificationGas,
                      verificationGasLimit,
                    },
                  } = await request(
                    "eth-sepolia",
                    "eth_estimateUserOperationGas",
                    [partialUserOperation, entryPointAddress]
                  );
                  const userOperation = {
                    ...partialUserOperation,
                    callGasLimit,
                    preVerificationGas,
                    verificationGasLimit,
                  } as any;
                  const userOpHash = await readContract(config, {
                    abi: entryPointAbi,
                    address: entryPointAddress,
                    functionName: "getUserOpHash",
                    args: [userOperation],
                  });
                  const signature = await walletClient.signMessage({
                    message: { raw: userOpHash },
                  });
                  userOperation.signature = signature;
                  console.log("userOperation", userOperation);
                  const sendUserOperationRes = await request(
                    "eth-sepolia",
                    "eth_sendUserOperation",
                    [userOperation, entryPointAddress]
                  );
                  console.log("sendUserOperationRes", sendUserOperationRes);
                }}
              >
                Test
              </Button>
            )}
          </div>
          <div>
            {(selectedDirectory
              ? selectedDirectory.subdirectories
              : directories
            ).map((directory) => (
              <Card
                key={directory.path}
                className="flex items-center p-2 cursor-pointer w-full mb-2"
                onClick={() => setSelectedDirectory(directory)}
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
            <Button
              onClick={() => {
                writeContract({
                  abi: ethDriveAbi,
                  address: ethDriveAddress,
                  functionName: "createDirectory",
                  args: [createDirectoryName],
                });
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
