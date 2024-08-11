"use client";

import {
  useAccount as useAccountKitAccount,
  useSmartAccountClient,
} from "@account-kit/react";
import { deepHexlify } from "@alchemy/aa-core";
import { File, Folder, GripVertical, PanelLeft, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Address,
  Hex,
  checksumAddress,
  encodeFunctionData,
  formatEther,
  fromHex,
  parseEther,
} from "viem";
import {
  usePublicClient,
  useAccount as useWagmiAccount,
  useWalletClient,
} from "wagmi";

import {
  updateAlchemyGasManagerWhiteList,
  withdrawIfUserOperationIsFundedInAlchemy,
} from "@/app/actions/integrate-alchemy-and-eth-drive-chain";
import { ExpandableDirectory } from "@/components/ExpandableDirectory";
import { Badge } from "@/components/ui/badge";
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
import { useTags } from "@/hooks/useTags";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { alchemySepoliaChain, request as requestAlchemy } from "@/lib/alchemy";

import { ethDriveAbi } from "../../../contracts/shared/app/abi";
import { ccipBnMAbi } from "../../../contracts/shared/app/external-abi";
import { ChainId } from "../../../contracts/shared/app/types";
import { chainlinkCCIPBnMAddresses } from "../../../contracts/shared/external-contract";
import { entryPointAddress } from "../../../contracts/shared/external-contract";
import { CopyToClipboard } from "./CopyToClipboard";
import { DepositManagerPlugin } from "./DepositManagerPlugin";
import { DirectoryPathBreadcrumb } from "./DirectoryPathBreadcrumb";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function EthDrive({ path }: { path?: string }) {
  const pathname = usePathname();

  const { plugins, setPlugins } = usePlugins();
  const {
    isConnected,
    chainId: connectedChainId,
    address: wagmiAddress,
  } = useWagmiAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { client: accountKitClient } = useSmartAccountClient({
    type: "LightAccount",
  });
  const { address: accountKitAccountAddress } = useAccountKitAccount({
    type: "LightAccount",
  });
  const connectedAddress = useMemo(() => {
    if (plugins.isAccountKitEnabled) {
      return accountKitAccountAddress;
    } else {
      return wagmiAddress;
    }
  }, [plugins.isAccountKitEnabled, wagmiAddress, accountKitAccountAddress]);

  const {
    rootDirectory,
    selectedDirectory,
    selectedDirectoryPath,
    selectedDirectoryChainId,
    connectedAddressDirectory,
    setSelectedDirectoryPath,
    refreshData,
  } = useDirectory(path, connectedAddress);

  const {
    chainPublicClient: selectedChainPublicClient,
    chainConfig: selectedChainConfig,
    chainAddresses: selectedChainAddresses,
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

  const [actualTransction, setActualTransaction] = useState<any>();
  const [transactionType, setTransactionType] = useState<
    "create" | "add-eth" | "add-ccip" | "move" | "wallet-connect"
  >("create");

  const [destinationPath, setDestinationPath] = useState("");

  const handleTransactionAsDirectory = useCallback(
    async (callData: Hex, destinationPath?: any, callback?: any) => {
      if (destinationPath) {
        setDestinationPath(destinationPath);
        setTransactionType("move");
      } else {
        setTransactionType("wallet-connect");
      }
      setTransactionStatusModalMode("preview");
      setIsTransactionStatusModalOpen(true);
      const actualTx = async () => {
        setTransactionStatusModalMode("progress");
        setCurrentStep("");
        setTransactionHash("");
        setError("");
        setSteps(accountAbstractionSteps as any);
        try {
          if (!walletClient) {
            throw new Error("Wallet client not found");
          }
          if (!selectedChainPublicClient) {
            throw new Error("Chain public client not found");
          }
          if (!selectedChainConfig) {
            throw new Error("Chain config not found");
          }
          if (!selectedChainAddresses) {
            throw new Error("Chain addresses not found");
          }
          console.log("handleTransactionAsDirectory");
          const account = selectedDirectory.tokenBoundAccount as Address;
          console.log("account", account);
          console.log("callData", callData);
          if (plugins.isAccountKitEnabled) {
            if (!accountKitClient) {
              throw new Error("Account kit client not found");
            }
            if (selectedDirectoryChainId !== 11155111) {
              throw new Error("Account Kit mode only supports Sepolia chain");
            }
            console.log("AccountKitEnabled");
            setCurrentStep("creating-user-operation");
            setCurrentStep("wait-for-user-signature");
            setCurrentStep("sending-user-operation");
            setCurrentStep("wait-for-block-confirmation");
            const txHash = await accountKitClient.sendTransaction({
              to: account,
              data: callData,
              chain: alchemySepoliaChain,
            });
            console.log("txHash", txHash);
            setTransactionHash(txHash);
            setCurrentStep("confirmed");
          } else {
            if (selectedChainConfig.isAccountAbstractionEnabled) {
              console.log("account abstraction is enabled");
              if (!selectedChainSmartAccount) {
                throw new Error("Smart account not found");
              }
              if (!selectedChainSmartAccountClient) {
                throw new Error("Smart account client not found");
              }
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
              console.log(
                "selectedChainConfig.alchemyGasManagerPolicyIdWithWithdraw",
                selectedChainConfig.alchemyGasManagerPolicyIdWithWithdraw,
              );
              console.log(
                "plugins.isCrosschainGasSubsidiaryEnabled",
                plugins.isCrosschainGasSubsidiaryEnabled,
              );
              if (
                selectedChainConfig.alchemyGasManagerPolicyIdWithWithdraw &&
                plugins.isCrosschainGasSubsidiaryEnabled
              ) {
                //  make calc simpler for now
                const gasMaxPrice = fromHex(uoStruct.maxFeePerGas, "bigint");
                // + fromHex(uoStruct.maxPriorityFeePerGas, "bigint");
                const gasAmount =
                  // fromHex(uoStruct.preVerificationGas, "bigint") +
                  // fromHex(uoStruct.verificationGasLimit, "bigint") +
                  fromHex(uoStruct.callGasLimit, "bigint");
                const requiredFee = gasMaxPrice * gasAmount;
                console.log("requiredFee", requiredFee);
                await updateAlchemyGasManagerWhiteList(
                  selectedDirectoryChainId?.toString() as ChainId,
                  selectedDirectory.tokenBoundAccount as Address,
                  requiredFee.toString(),
                );
                const requestPaymasterAndDataRes = await requestAlchemy(
                  selectedChainConfig.alchemyChainName,
                  "alchemy_requestPaymasterAndData",
                  [
                    {
                      policyId:
                        selectedChainConfig.alchemyGasManagerPolicyIdWithWithdraw,
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
              } else if (selectedChainConfig.alchemyGasManagerPolicyId) {
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
                    retries: {
                      intervalMs: 5000,
                      multiplier: 1,
                      maxRetries: 100,
                    },
                  },
                );
              setCurrentStep("confirmed");
              console.log("txHash", txHash);
              setTransactionHash(txHash);
              setTimeout(() => {
                refreshData();
              }, 5000);
              if (callback) {
                callback(txHash);
              }

              if (
                selectedChainConfig.alchemyGasManagerPolicyIdWithWithdraw &&
                plugins.isCrosschainGasSubsidiaryEnabled
              ) {
                console.log(
                  "set up sync balance with EthDrive gas subsidiary chain",
                );
                const maxRetries = 10;
                let retryCount = 0;
                const attemptWithdraw = async () => {
                  try {
                    console.log(
                      "sync balance with EthDrive gas subsidiary chain...",
                    );
                    await withdrawIfUserOperationIsFundedInAlchemy(
                      selectedDirectoryChainId?.toString() as ChainId,
                      requestId,
                    );
                    console.log("sync completed!!");
                  } catch (e: any) {
                    retryCount++;
                    if (
                      e.message === "Already processed" ||
                      retryCount >= maxRetries
                    ) {
                      console.log("Process completed or max retries reached.");
                    } else {
                      console.log("Withdraw failed: ", e.message);
                      console.log(`Retrying... (${retryCount}/${maxRetries})`);
                      setTimeout(attemptWithdraw, 5000); // Wait for 1 second before retrying
                    }
                  }
                };
                attemptWithdraw();
              }
            } else {
              console.log("account abstraction is not enabled");
              await handleTransaction(
                account,
                BigInt(0),
                callData as Hex,
                callback,
              );
            }
          }
        } catch (e: any) {
          setError(e.message);
        }
      };
      setActualTransaction(() => actualTx);
    },
    [
      walletClient,
      selectedDirectory,
      selectedDirectoryChainId,
      selectedChainConfig,
      selectedChainPublicClient,
      selectedChainAddresses,
      selectedChainSmartAccount,
      selectedChainSmartAccountClient,
      getFeeEstimateForSmartAccountTransaction,
    ],
  );

  const handleTransaction = useCallback(
    async (to: Address, value = BigInt(0), callData: Hex, callback?: any) => {
      console.log("handleTransaction");
      setTransactionStatusModalMode("progress");
      setCurrentStep("");
      setTransactionHash("");
      setError("");
      setSteps(transactionSteps as any);
      try {
        if (!selectedDirectoryChainId) {
          throw new Error("Selected directory chain id not found");
        }
        console.log("selectedDirectoryChainId", selectedDirectoryChainId);
        if (plugins.isAccountKitEnabled) {
          console.log("AccountKitEnabled");
          if (!accountKitClient) {
            throw new Error("Account kit client not found");
          }
          setCurrentStep("checking-network");
          if (selectedDirectoryChainId !== 11155111) {
            throw new Error("Account Kit mode only supports Sepolia chain");
          }
          setCurrentStep("wait-for-user-signature");
          setCurrentStep("wait-for-block-confirmation");
          const txHash = await accountKitClient.sendTransaction({
            to,
            value,
            data: callData,
            chain: alchemySepoliaChain,
          });
          console.log("txHash", txHash);
          setTransactionHash(txHash);
          setCurrentStep("confirmed");
          if (callback) {
            callback(txHash);
          }
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
          setCurrentStep("checking-network");
          console.log("connectedChainId", connectedChainId);
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
            setTimeout(() => {
              refreshData();
            }, 5000);
            if (callback) {
              callback(txHash);
            }
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
  const {
    web3wallet,
    uri,
    setUri,
    proposerName,
    proposerUrl,
    proposerIcon,
    to,
    value,
    data,
    refresh: refreshWalletConnect,
  } = useWalletConnect(selectedDirectory, handleTransactionAsDirectory);

  async function handleCreateDirectoryTransaction() {
    setIsCreateDirectoryModalOpen(false);
    if (!selectedChainAddresses) {
      throw new Error("Selected chain addresses not found");
    }
    const pathParts = selectedDirectoryPath.split("/");
    const adjustedPath = pathParts.slice(2).join("/");
    const finalPath = adjustedPath
      ? `${adjustedPath}/${createDirectoryName}`
      : createDirectoryName;
    console.log("finalPath", finalPath);
    const callData = encodeFunctionData({
      abi: ethDriveAbi,
      functionName: "createDirectory",
      args: [finalPath],
    });
    setActualTransaction(() => () => {
      handleTransaction(
        selectedChainAddresses.ethDrive,
        BigInt(0),
        callData as Hex,
      );
    });
    setTransactionStatusModalMode("preview");
    setTransactionType("create");
    setIsTransactionStatusModalOpen(true);
  }

  async function handleDepositETH() {
    console.log("depositing 0.001 ETH...");
    const to = selectedDirectory.tokenBoundAccount;
    const value = parseEther("0.001");
    setActualTransaction(() => () => {
      handleTransaction(to as Address, value, "0x");
    });
    setTransactionStatusModalMode("preview");
    setTransactionType("add-eth");
    setIsTransactionStatusModalOpen(true);
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
    setActualTransaction(() => () => {
      handleTransaction(to as Address, BigInt(0), callData as Hex);
    });
    setTransactionStatusModalMode("preview");
    setTransactionType("add-ccip");
    setIsTransactionStatusModalOpen(true);
  }

  const [createDirectoryName, setCreateDirectoryName] = useState("");
  const [isOlnyShowConnectedDirectory, setIsOlnyShowConnectedDirectory] =
    useState(false);
  const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] =
    useState(false);
  const [isTransactionStatusModalOpen, setIsTransactionStatusModalOpen] =
    useState(false);
  const [transactionStatusModalMode, setTransactionStatusModalMode] = useState<
    "preview" | "progress"
  >("preview");

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (pathname !== `/${selectedDirectoryPath}`) {
      window.history.pushState(null, "", `/${selectedDirectoryPath}`);
    }
  }, [selectedDirectoryPath]);

  useEffect(() => {
    if (pathname !== `/${selectedDirectoryPath}`) {
      console.log("pathname", pathname);
      console.log("selectedDirectoryPath", selectedDirectoryPath);
      setSelectedDirectoryPath(pathname.slice(1));
    }
  }, [pathname]);

  const [owners, setOwners] = useState([""]); // Start with one empty owner input

  // Handle the change of an owner's input
  const handleOwnerChange = (index: number, value: string) => {
    const updatedOwners = [...owners];
    updatedOwners[index] = value;
    setOwners(updatedOwners);
  };

  // Add a new owner input
  const addOwner = () => {
    setOwners([...owners, ""]);
  };

  // Remove an owner input
  const removeOwner = (index: number) => {
    const updatedOwners = owners.filter((_, i) => i !== index);
    setOwners(updatedOwners);
  };

  const { tags } = useTags(
    selectedDirectoryChainId,
    connectedAddress,
    selectedDirectory.tokenBoundAccount as Address,
  );
  console.log("tags", tags);

  return (
    <div className="flex flex-col h-screen">
      <Header
        isDirectorySelected={selectedDirectory.depth >= 1}
        openCreateDirectoryDialog={() => {
          setIsCreateDirectoryModalOpen(true);
        }}
        openSettingsDialog={() => {
          setIsSettingsModalOpen(true);
        }}
      />
      <div className="flex flex-grow">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
          <div className="mb-4">
            <p className="font-bold mb-2">All Directories</p>
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
              <p className="font-bold mb-2">My Directories</p>
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
          <button
            onClick={toggleSidebar}
            onDragOver={() => {
              if (!isSidebarOpen) {
                toggleSidebar();
              }
            }}
            className={`md:hidden mb-2 p-2 text-gray-600 hover:text-gray-800 focus:outline-none transition-transform duration-500 ease-in-out`}
            style={{
              transform: isSidebarOpen
                ? "translateX(15rem) rotate(0deg)"
                : "translateX(0) rotate(180deg)",
            }}
          >
            <PanelLeft size={24} />
          </button>
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
          {selectedDirectoryPath != selectedDirectory.path && (
            <div className="fixed inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
            </div>
          )}
          {selectedDirectoryPath == selectedDirectory.path && (
            <div>
              {selectedDirectory.depth >= 2 && (
                <Card className="p-4 mb-8">
                  <div className="mb-4">
                    {selectedDirectory.tokenBoundAccount && (
                      <>
                        <p className="font-bold text-sm mb-2">
                          Token Bound Account
                        </p>
                        <div className="flex items-center">
                          <p className="text-xs text-gray-600">
                            {checksumAddress(
                              selectedDirectory.tokenBoundAccount as Address,
                            )}
                          </p>
                          <CopyToClipboard
                            text={selectedDirectory.tokenBoundAccount}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {selectedDirectory.holder && (
                    <div>
                      <p className="font-bold text-sm mb-2">Owner</p>
                      <div className="flex items-center">
                        <p className="text-xs text-gray-600">
                          {checksumAddress(selectedDirectory.holder as Address)}
                        </p>
                        <CopyToClipboard text={selectedDirectory.holder} />
                      </div>
                    </div>
                  )}
                  {selectedDirectoryChainId == 11155111 && (
                    <div className="mt-4">
                      <p className="font-bold text-sm mb-2">Tags</p>
                      <div className="flex space-x-2">
                        {tags.map((tag) => (
                          <Link
                            href={`https://sepolia.easscan.org/attestation/view/${tag.id}`}
                            target="_blank"
                          >
                            <Badge
                              variant="outline"
                              className="w-full h-full hover:bg-accent hover:text-accent-foreground"
                            >
                              {tag.value}
                            </Badge>
                          </Link>
                        ))}
                        <Link
                          href="https://sepolia.easscan.org/attestation/attestWithSchema/0x00e3e054d5f8f8f81c25009189773997ba5b4e082eba3edef2d93134dda7e81a"
                          target="_blank"
                        >
                          <Button className="rounded-full" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              )}
              {selectedDirectory.subdirectories.length > 0 && (
                <p className="font-bold mb-2">Directories</p>
              )}
              <div className="mb-8">
                {(selectedDirectory.depth >= 1 &&
                isOlnyShowConnectedDirectory &&
                connectedAddress
                  ? selectedDirectory.subdirectories
                      .filter((subDir) => subDir.name)
                      .filter(
                        (subDir) =>
                          subDir.holder?.toLowerCase() ===
                          connectedAddress.toLowerCase(),
                      )
                  : selectedDirectory.subdirectories.filter(
                      (subDir) => subDir.name,
                    )
                ).map((directory) => (
                  <Card
                    key={directory.path}
                    className="relative flex items-center p-4 cursor-pointer w-full mb-2"
                    onClick={() => {
                      setSelectedDirectoryPath(directory.path);
                    }}
                    onDragOver={handleDragOver}
                    onDrop={() => handleFileDrop(directory.path)}
                  >
                    {directory.depth == 1 && (
                      <Image
                        src={`/logo-${directory.path.split("/")[1]}.svg`}
                        alt={`logo-${directory.path.split("/")[1]}`}
                        width="24"
                        height="24"
                        className="mr-3"
                      />
                    )}
                    {directory.depth >= 2 && (
                      <Folder className="h-6 w-6 mr-3" />
                    )}
                    <span>{directory.name}</span>
                    <span className="absolute bottom-1 right-3 text-xs text-gray-400 truncate w-24 md:w-80 text-right">
                      {directory.tokenBoundAccount}
                    </span>
                  </Card>
                ))}
              </div>
              {selectedDirectory.files.length > 0 && (
                <p className="font-bold mb-2">Files</p>
              )}
              <div className="mb-8 space-y-2">
                {selectedDirectory.files.map((file, i) => (
                  <Card
                    key={`files_${i}`}
                    className="flex items-center justify-between p-4 cursor-pointer w-full cursor-move relative"
                    draggable
                    onDragStart={handleDragStart(file)}
                  >
                    <div className="flex items-center">
                      <File className="h-6 w-6 mr-2" />
                      {file.type == "native" && (
                        <span>{formatEther(BigInt(file.amount))} ETH</span>
                      )}
                      {file.type == "weth" && (
                        <span>{formatEther(BigInt(file.amount))} WETH</span>
                      )}
                      {file.type == "ccip" && (
                        <span>{formatEther(BigInt(file.amount))} BnM</span>
                      )}
                    </div>
                    <div>
                      <GripVertical className="h-6 w-6 text-gray-400" />
                    </div>
                  </Card>
                ))}
              </div>
              <div>
                {selectedDirectory.depth >= 2 &&
                  selectedDirectory.holder?.toLowerCase() ==
                    connectedAddress?.toLowerCase() && (
                    <div>
                      <div className="mb-2">
                        <p className="font-semibold">
                          WalletConnect with Directory
                        </p>
                        {selectedDirectoryChainId !== 11155111 && (
                          <p className="mt-1 text-xs text-red-400">
                            * Only activated for Sepolia now.
                          </p>
                        )}
                      </div>
                      <Card className="mb-8 p-4">
                        {!proposerName && (
                          <>
                            <Input
                              type="text"
                              placeholder="wc:"
                              className="mb-2"
                              onChange={(e) => setUri(e.target.value)}
                              disabled={selectedDirectoryChainId !== 11155111}
                            />
                            <Button
                              className="w-full"
                              disabled={
                                selectedDirectoryChainId !== 11155111 || !uri
                              }
                              onClick={() => {
                                web3wallet.pair({ uri });
                              }}
                            >
                              Pair Directory with dApp
                            </Button>
                          </>
                        )}
                        {proposerName && (
                          <>
                            <p className="mb-4 font-medium">Connected dApp</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <img className="w-6 h-6" src={proposerIcon} />
                              <p className="text-sm font-medium">
                                {proposerName}
                              </p>
                            </div>
                            <Link
                              className="text-blue-700 underline text-sm"
                              target="_blank"
                              href={proposerUrl}
                            >
                              {proposerUrl}
                            </Link>
                            <Button
                              className="w-full mt-4"
                              onClick={() => {
                                refreshWalletConnect();
                              }}
                            >
                              Disconnect
                            </Button>
                          </>
                        )}
                      </Card>
                      <div className="bg-gray-100 p-4 rounded">
                        <p className="mb-2 font-semibold text-sm">
                          Tester Actions
                        </p>
                        <div className="flex space-x-2">
                          {!plugins.isAccountKitEnabled && (
                            <Button
                              size="sm"
                              onClick={() => {
                                handleDepositETH();
                              }}
                            >
                              Add 0.001 Native Token
                            </Button>
                          )}
                          {!plugins.isAccountKitEnabled &&
                            selectedChainConfig?.isCCIPEnabled && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleMintMnB();
                                }}
                              >
                                Add 1 CCIP BnM
                              </Button>
                            )}
                        </div>
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
          <label className="block text-sm font-medium text-gray-700 mt-4">
            {selectedDirectoryPath}/
          </label>
          <Input
            placeholder="Enter directory name"
            value={createDirectoryName}
            onChange={(e) => setCreateDirectoryName(e.target.value)}
          />
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Additional owners with EAS
            </label>
            {selectedDirectoryChainId !== 11155111 && (
              <p className="mt-1 text-xs text-red-400">
                * Only activated for Sepolia now.
              </p>
            )}
            {owners.map((owner, index) => (
              <div key={index} className="flex items-center mt-2">
                <Input
                  placeholder="Enter owner's name or email"
                  value={owner}
                  onChange={(e) => handleOwnerChange(index, e.target.value)}
                  className="mr-2"
                  disabled={selectedDirectoryChainId !== 11155111}
                />
                <Button
                  variant="outline"
                  onClick={() => removeOwner(index)}
                  disabled={selectedDirectoryChainId !== 11155111}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addOwner}
              className="mt-2"
              disabled={selectedDirectoryChainId !== 11155111}
            >
              + Add Owner
            </Button>
          </div>

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
          {transactionStatusModalMode == "preview" && (
            <>
              <DialogHeader>
                <DialogTitle>Transaction Preview</DialogTitle>
              </DialogHeader>
              <div className="my-4">
                {transactionType == "create" && (
                  <>
                    <p className="text-gray-600 font-medium">
                      Create Directory
                    </p>
                    <p className="text-gray-800 mt-2 text-sm">
                      {selectedDirectoryPath}/{createDirectoryName}
                    </p>
                  </>
                )}
                {transactionType == "add-eth" && (
                  <>
                    <p className="text-gray-600 font-medium">
                      Add 0.001 Native Token to
                    </p>
                    <p className="text-gray-800 mt-2 text-sm">
                      {selectedDirectoryPath}
                    </p>
                  </>
                )}
                {transactionType == "add-ccip" && (
                  <>
                    <p className="text-gray-600 font-medium">
                      Add 1 CCIP BnM to
                    </p>
                    <p className="text-gray-800 mt-2 text-sm">
                      {selectedDirectoryPath}
                    </p>
                  </>
                )}
                {transactionType == "move" && (
                  <>
                    <p className="text-gray-600 font-medium">Move File</p>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800 mt-2 text-sm">
                          From: {selectedDirectoryPath}
                        </p>
                        <Image
                          src={`/logo-${selectedDirectoryPath.split("/")[1]}.svg`}
                          alt="target-chain"
                          width="20"
                          height="20"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800 mt-2 text-sm">
                          To: {destinationPath}
                        </p>
                        <Image
                          src={`/logo-${destinationPath.split("/")[1]}.svg`}
                          alt="target-chain"
                          width="20"
                          height="20"
                        />
                      </div>
                    </div>
                  </>
                )}
                {transactionType == "wallet-connect" && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 font-medium mb-4">
                        Transaction Request
                      </p>
                      <div className="flex items-center space-x-2 mb-4">
                        <img
                          className="w-6 h-6"
                          src={proposerIcon}
                          alt="Proposer Icon"
                        />
                        <p className="text-sm font-medium">{proposerName}</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <p className="text-gray-800 text-xs">To: {to}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-gray-800 text-xs">
                          Value: {formatEther(fromHex(value as Hex, "bigint"))}{" "}
                          ETH
                        </p>
                      </div>
                      <div className="mb-2">
                        <p className="text-gray-800 text-xs">Data: {data}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (actualTransction) {
                      actualTransction();
                    }
                  }}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </>
          )}
          {transactionStatusModalMode == "progress" && (
            <>
              <DialogHeader>
                <DialogTitle>Transaction Status</DialogTitle>
              </DialogHeader>
              <div className="my-4">
                {transactionType == "create" && (
                  <>
                    <p className="text-gray-600 font-medium">
                      Create Directory
                    </p>
                    <p className="text-gray-800 mt-2 text-sm">
                      {selectedDirectoryPath}/{createDirectoryName}
                    </p>
                  </>
                )}
                {transactionType == "add-eth" && (
                  <>
                    <p className="text-gray-600 font-medium">
                      Add 0.001 Native Token to
                    </p>
                    <p className="text-gray-800 mt-2 text-sm">
                      {selectedDirectoryPath}
                    </p>
                  </>
                )}
                {transactionType == "add-ccip" && (
                  <>
                    <p className="text-gray-600 font-medium">
                      Add 1 CCIP BnM to
                    </p>
                    <p className="text-gray-800 mt-2 text-sm">
                      {selectedDirectoryPath}
                    </p>
                  </>
                )}
                {transactionType == "move" && (
                  <>
                    <p className="text-gray-600 font-medium">Move File</p>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800 mt-2 text-sm">
                          From: {selectedDirectoryPath}
                        </p>
                        <Image
                          src={`/logo-${selectedDirectoryPath.split("/")[1]}.svg`}
                          alt="target-chain"
                          width="20"
                          height="20"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800 mt-2 text-sm">
                          To: {destinationPath}
                        </p>
                        <Image
                          src={`/logo-${destinationPath.split("/")[1]}.svg`}
                          alt="target-chain"
                          width="20"
                          height="20"
                        />
                      </div>
                    </div>
                  </>
                )}
                {transactionType == "wallet-connect" && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 font-medium mb-4">
                        Transaction Request
                      </p>
                      <div className="flex items-center space-x-2 mb-4">
                        <img
                          className="w-6 h-6"
                          src={proposerIcon}
                          alt="Proposer Icon"
                        />
                        <p className="text-sm font-medium">{proposerName}</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <p className="text-gray-800 text-xs">To: {to}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-gray-800 text-xs">
                          Value: {formatEther(fromHex(value as Hex, "bigint"))}{" "}
                          ETH
                        </p>
                      </div>
                      <div className="mb-2">
                        <p className="text-gray-800 text-xs">Data: {data}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div>
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
                {currentStep == "confirmed" && transactionHash && (
                  <div className="mt-8 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 break-all text-xs">
                    <p className="mb-2">Transaction Detail:</p>
                    <Link
                      className="underline"
                      href={`${selectedChainConfig?.exproler}/tx/${transactionHash}`}
                      target="_blank"
                    >
                      {selectedChainConfig?.exproler}/tx/{transactionHash}
                    </Link>
                    {destinationPath &&
                      selectedDirectoryPath.split("/")[1] !==
                        destinationPath.split("/")[1] && (
                        <div className="mt-4">
                          <p className="mb-2">CCIP Bridge Detail:</p>
                          <Link
                            className="underline"
                            href={`https://ccip.chain.link/tx/${transactionHash}`}
                            target="_blank"
                          >
                            https://ccip.chain.link/tx/{transactionHash}
                          </Link>
                        </div>
                      )}
                  </div>
                )}
                {error && (
                  <div className="mt-8 p-2 bg-red-100 border border-red-300 rounded text-red-700 break-all text-xs">
                    {error}
                  </div>
                )}
              </div>
            </>
          )}
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
            <DepositManagerPlugin />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
