"use client";

import { useSmartAccountClient } from "@account-kit/react";
import { deepHexlify } from "@alchemy/aa-core";
import { File, Folder } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useState } from "react";
import {
  Address,
  Hex,
  encodeFunctionData,
  formatEther,
  parseEther,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChain } from "@/hooks/useChain";
import { useDirectory } from "@/hooks/useDirectory";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { usePlugins } from "@/hooks/usePlugins";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { alchemyChains, request as requestAlchemy } from "@/lib/alchemy";

import { ethDriveAbi } from "../../../contracts/shared/app/abi";
import { ccipBnMAbi } from "../../../contracts/shared/app/external-abi";
import { chainlinkCCIPBnMAddresses } from "../../../contracts/shared/external-contract";
import { entryPointAddress } from "../../../contracts/shared/external-contract";
import { CopyToClipboard } from "./CopyToClipboard";
import { DirectoryPathBreadcrumb } from "./DirectoryPathBreadcrumb";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function EthDrive({ path }: { path?: string }) {
  const { plugins, setPlugins } = usePlugins();

  const {
    isConnected,
    chainId: connectedChainId,
    address: connectedAddress,
  } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { client: accountKitClient } = useSmartAccountClient({
    type: "LightAccount",
  });

  const {
    rootDirectory,
    selectedDirectory,
    selectedDirectoryPath,
    selectedDirectoryChainId,
    connectedAddressDirectory,
    setSelectedDirectoryPath,
  } = useDirectory(path, connectedAddress);

  const { chainAddresses: connectedChainAddresses } =
    useChain(connectedChainId);
  const {
    chainPublicClient: selectedChainPublicClient,
    chainConfig: selectedChainConfig,
    chainAddresses: selectedChainAddresses,
    alchemyChain: selectedChainAlchemyChain,
  } = useChain(selectedDirectoryChainId);

  const {
    smartAccount: selectedChainSmartAccount,
    smartAccountClient: selectedChainSmartAccountClient,
    getFeeEstimateForSmartAccountTransaction,
  } = useSmartAccount(
    selectedDirectoryChainId,
    selectedDirectory.tokenBoundAccount as Address,
    selectedChainPublicClient,
    walletClient,
  );

  const {
    transactionSteps,
    accountAbstractionSteps,
    steps,
    currentStep,
    error,
    transactionHash,
    setSteps,
    setCurrentStep,
    setTransactionHash,
    setError,
    getStepIcon,
  } = useTransactionStatus();

  const handleTransactionAsDirectory = useCallback(
    async (callData: Hex) => {
      setCurrentStep("");
      setTransactionHash("");
      setError("");
      if (!walletClient) {
        throw new Error("Wallet client not found");
      }
      if (!selectedChainPublicClient) {
        throw new Error("Chain public client not found");
      }
      if (!selectedChainSmartAccount) {
        throw new Error("Smart account not found");
      }
      if (!selectedChainSmartAccountClient) {
        throw new Error("Smart account client not found");
      }
      if (!selectedChainConfig) {
        throw new Error("Chain config not found");
      }
      if (!selectedChainAddresses) {
        throw new Error("Chain addresses not found");
      }
      if (!selectedChainAlchemyChain) {
        throw new Error("Chain alchemy chain not found");
      }
      console.log("handleTransactionAsDirectory");
      const account = selectedDirectory.tokenBoundAccount as Address;
      console.log("account", account);
      console.log("callData", callData);
      if (plugins.isAccountKitEnabled && accountKitClient) {
        const tx = await accountKitClient.sendTransaction({
          to: account,
          data: callData,
          chain: selectedChainAlchemyChain,
        });
        console.log("tx", tx);
      } else {
        if (selectedChainConfig.isAccountAbstractionEnabled) {
          console.log("account abstraction is enabled");
          setIsTransactionStatusModalOpen(true);
          setSteps(accountAbstractionSteps as any);
          setCurrentStep("creating-user-operation");
          const _uoStruct =
            await selectedChainSmartAccountClient.buildUserOperation({
              uo: callData,
              account: selectedChainSmartAccount,
            });
          const uoStruct = _uoStruct as any;
          console.log("uoStruct", uoStruct);
          console.log("custom fee estimation");
          const { maxFeePerGas, maxPriorityFeePerGas } =
            await getFeeEstimateForSmartAccountTransaction();
          uoStruct.maxFeePerGas = maxFeePerGas;
          uoStruct.maxPriorityFeePerGas = maxPriorityFeePerGas;
          if (selectedChainConfig.alchemyGasManagerPolicyId) {
            const requestPaymasterAndDataRes = await requestAlchemy(
              selectedChainConfig.alchemyChainName,
              "alchemy_requestPaymasterAndData",
              [
                {
                  policyId: selectedChainConfig.alchemyGasManagerPolicyId,
                  entryPoint: entryPointAddress,
                  userOperation: deepHexlify(uoStruct),
                },
              ],
            );
            if (requestPaymasterAndDataRes.error) {
              throw new Error(requestPaymasterAndDataRes.error.message);
            }
            const { paymasterAndData } = requestPaymasterAndDataRes.result;
            console.log("paymasterAndData", paymasterAndData);
            uoStruct.paymasterAndData = paymasterAndData;
          } else {
            uoStruct.paymasterAndData =
              selectedChainAddresses.ethDrivePaymaster;
          }
          setCurrentStep("wait-for-user-signature");
          const request =
            await selectedChainSmartAccountClient.signUserOperation({
              uoStruct,
              account: selectedChainSmartAccount,
            });
          console.log("request", request);
          setCurrentStep("sending-user-operation");
          const requestId =
            await selectedChainSmartAccountClient.sendRawUserOperation(
              request,
              entryPointAddress,
            );
          console.log("requestId", requestId);
          setCurrentStep("wait-for-block-confirmation");
          const txHash =
            await selectedChainSmartAccountClient.waitForUserOperationTransaction(
              {
                hash: requestId,
                retries: { intervalMs: 5000, multiplier: 1, maxRetries: 100 },
              },
            );
          setCurrentStep("confirmed");
          console.log("txHash", txHash);
          setTransactionHash(txHash);
        } else {
          console.log("account abstraction is not enabled");
          await handleTransaction(account, BigInt(0), callData as Hex);
        }
      }
    },
    [
      walletClient,
      selectedDirectory,
      selectedChainConfig,
      selectedChainPublicClient,
      selectedChainAddresses,
      selectedChainAlchemyChain,
      selectedChainSmartAccount,
      selectedChainSmartAccountClient,
      getFeeEstimateForSmartAccountTransaction,
    ],
  );

  const handleTransaction = useCallback(
    async (to: Address, value = BigInt(0), callData: Hex) => {
      console.log("handleTransaction");
      setCurrentStep("");
      setTransactionHash("");
      setError("");
      try {
        console.log("selectedChainAlchemyChain", selectedChainAlchemyChain);
        console.log("plugins.isAccountKitEnabled", plugins.isAccountKitEnabled);
        console.log("accountKitClient", accountKitClient);
        if (plugins.isAccountKitEnabled && accountKitClient) {
          console.log("using account kit...");
          const tx = await accountKitClient.sendTransaction({
            to,
            value,
            data: callData,
            chain: alchemyChains["11155111"],
          });
          console.log("tx", tx);
        } else {
          if (!publicClient) {
            throw new Error("Public client not found");
          }
          if (!walletClient) {
            throw new Error("Wallet client not found");
          }
          if (!connectedChainId) {
            throw new Error("Connected chain id not found");
          }
          if (!selectedDirectoryChainId) {
            throw new Error("Selected directory chain id not found");
          }
          setIsTransactionStatusModalOpen(true);
          setSteps(transactionSteps as any);
          setCurrentStep("checking-network");
          console.log("connectedChainId", connectedChainId);
          console.log("selectedDirectoryChainId", selectedDirectoryChainId);
          if (connectedChainId !== selectedDirectoryChainId) {
            console.log("switching chain...");
            setError("Please switch to the directory chain");
            await walletClient.switchChain({ id: selectedDirectoryChainId });
            setIsTransactionStatusModalOpen(false);
          } else {
            setCurrentStep("wait-for-user-signature");
            console.log("handleTransaction");
            console.log("to", to);
            console.log("callData", callData);
            const txHash = await walletClient.sendTransaction({
              to,
              value,
              data: callData,
            });
            console.log("txHash", txHash);
            setCurrentStep("wait-for-block-confirmation");
            setTransactionHash(txHash);
            const receipt = await publicClient.waitForTransactionReceipt({
              hash: txHash,
            });
            console.log("receipt", receipt);
            setCurrentStep("confirmed");
          }
        }
      } catch (error: any) {
        setError(error.message);
      }
    },
    [
      walletClient,
      connectedChainId,
      selectedDirectoryChainId,
      plugins.isAccountKitEnabled,
      accountKitClient,
    ],
  );

  const { handleDragStart, handleDragOver, handleFileDrop } = useDragAndDrop(
    rootDirectory,
    handleTransactionAsDirectory,
  );
  const { web3wallet, uri, setUri } = useWalletConnect(
    selectedDirectory,
    handleTransactionAsDirectory,
  );

  async function handleCreateDirectoryTransaction() {
    // if (!connectedChainAddresses) {
    //   throw new Error("Connected chain addresses not found");
    // }
    const callData = encodeFunctionData({
      abi: ethDriveAbi,
      functionName: "createDirectory",
      args: [createDirectoryName],
    });
    handleTransaction(
      "0x178E93a49838D10e46ff6d8999f124965bC4178e",
      // connectedChainAddresses.ethDrive,

      BigInt(0),
      callData as Hex,
    );
  }

  async function handleDepositETH() {
    console.log("depositing 0.001 ETH...");
    const to = selectedDirectory.tokenBoundAccount;
    const value = parseEther("0.001");
    handleTransaction(to as Address, value, "0x");
  }

  async function handleMintMnB() {
    console.log("minting 1 CCIP BnM token...");
    const callData = encodeFunctionData({
      abi: ccipBnMAbi,
      functionName: "drip",
      args: [selectedDirectory.tokenBoundAccount as Address],
    });
    const chainId =
      selectedDirectoryChainId?.toString() as keyof typeof chainlinkCCIPBnMAddresses;
    const to = chainlinkCCIPBnMAddresses[chainId];
    handleTransaction(to as Address, BigInt(0), callData as Hex);
  }

  const [createDirectoryName, setCreateDirectoryName] = useState("");
  const [isOlnyShowConnectedDirectory, setIsOlnyShowConnectedDirectory] =
    useState(false);
  const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] =
    useState(false);
  const [isTransactionStatusModalOpen, setIsTransactionStatusModalOpen] =
    useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Header
        openCreateDirectoryDialog={() => {
          setIsCreateDirectoryModalOpen(true);
        }}
        openSettingsDialog={() => {
          setIsSettingsModalOpen(true);
        }}
      />
      <div className="flex flex-grow">
        <Sidebar>
          <div>
            <p className="font-medium mb-2">All Directories</p>
            <ExpandableDirectory
              directory={rootDirectory}
              onSelected={(path) => {
                setIsOlnyShowConnectedDirectory(false);
                setSelectedDirectoryPath(path);
              }}
              onFileDrop={handleFileDrop}
            />
          </div>
          {isConnected && (
            <div>
              <p className="font-medium mb-2">My Directories</p>
              <ExpandableDirectory
                directory={connectedAddressDirectory}
                onSelected={(path) => {
                  setIsOlnyShowConnectedDirectory(true);
                  setSelectedDirectoryPath(path);
                }}
                onFileDrop={handleFileDrop}
              />
            </div>
          )}
        </Sidebar>
        <div className="p-4 w-full">
          <div className="flex justify-between items-center mb-4">
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
          </div>
          {isConnected && (
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                checked={isOlnyShowConnectedDirectory}
                onCheckedChange={setIsOlnyShowConnectedDirectory}
              />
              <Label htmlFor="airplane-mode">
                Only show connected address&apos;s directory
              </Label>
            </div>
          )}
          {selectedDirectoryPath == selectedDirectory.path && (
            <div>
              <div className="mb-4 space-y-2">
                {selectedDirectory.tokenBoundAccount && (
                  <div className="flex items-center">
                    <p className="text-sm">
                      Token Bound Account: {selectedDirectory.tokenBoundAccount}
                    </p>
                    <CopyToClipboard
                      text={selectedDirectory.tokenBoundAccount}
                    />
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
              <div className="mb-4">
                {(selectedDirectory.depth >= 1 &&
                isOlnyShowConnectedDirectory &&
                connectedAddress
                  ? selectedDirectory.subdirectories.filter(
                      (subDir) =>
                        subDir.holder?.toLowerCase() ===
                        connectedAddress.toLowerCase(),
                    )
                  : selectedDirectory.subdirectories
                ).map((directory) => (
                  <Card
                    key={directory.path}
                    className="flex items-center p-2 cursor-pointer w-full mb-2"
                    onClick={() => {
                      setSelectedDirectoryPath(directory.path);
                    }}
                    onDragOver={handleDragOver}
                    onDrop={() => handleFileDrop(directory.path)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    <span>{directory.name}</span>
                  </Card>
                ))}
                {selectedDirectory.files.map((file, i) => (
                  <React.Fragment key={`files_${i}`}>
                    <Card
                      className="flex items-center p-2 cursor-pointer w-full mb-2"
                      draggable
                      onDragStart={handleDragStart(file)}
                    >
                      <File className="h-4 w-4 mr-2" />
                      {file.type == "native" && (
                        <span>{formatEther(BigInt(file.amount))} ETH</span>
                      )}
                      {file.type == "weth" && (
                        <span>{formatEther(BigInt(file.amount))} WETH</span>
                      )}
                      {file.type == "ccip" && (
                        <span>{formatEther(BigInt(file.amount))} BnM</span>
                      )}
                    </Card>
                  </React.Fragment>
                ))}
              </div>
              <div>
                {selectedDirectory.depth >= 2 &&
                  selectedDirectory.holder?.toLowerCase() ==
                    connectedAddress?.toLowerCase() && (
                    <div>
                      <div className="flex space-x-2 mb-4">
                        <Button
                          onClick={() => {
                            handleDepositETH();
                          }}
                        >
                          Add 0.001 ETH
                        </Button>
                        {selectedChainConfig?.isCCIPEnabled && (
                          <Button
                            onClick={() => {
                              handleMintMnB();
                            }}
                          >
                            Add 1 CCIP BnM
                          </Button>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="wc:"
                          className="mb-2"
                          onChange={(e) => setUri(e.target.value)}
                        />
                        <Button
                          onClick={() => {
                            web3wallet.pair({ uri });
                          }}
                        >
                          Pair
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
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
            <Button onClick={handleCreateDirectoryTransaction}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isTransactionStatusModalOpen}
        onOpenChange={setIsTransactionStatusModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Status</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.key} className="flex items-center space-x-4">
                  {getStepIcon(step.key)}
                  <div className="flex-grow">
                    <p
                      className={`font-medium ${currentStep === step.key ? "text-blue-500" : ""}`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {transactionHash && (
              <div className="mt-4 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 break-all text-xs">
                <p className="mb-2">Transaction Detail:</p>
                <Link
                  href={`${selectedChainConfig?.exproler}/tx/${transactionHash}`}
                >
                  {selectedChainConfig?.exproler}/tx/${transactionHash}
                </Link>
              </div>
            )}
            {error && (
              <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded text-red-700 break-all text-xs">
                {error}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plugins</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <div className="flex items-center space-x-4 mb-4">
              <Switch
                checked={plugins.isAccountKitEnabled}
                onCheckedChange={(status) => {
                  console.log("status", status);
                  setPlugins((prev) => {
                    return {
                      ...prev,
                      isAccountKitEnabled: status,
                    };
                  });
                }}
              />
              <Label>Enable Alchemy Account kit</Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
