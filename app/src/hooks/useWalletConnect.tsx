"use client";

import { Core } from "@walletconnect/core";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { Web3Wallet, Web3WalletTypes } from "@walletconnect/web3wallet";
import { useEffect, useRef, useState } from "react";
import { Hex, encodeFunctionData, fromHex } from "viem";

import { getChainIdFromPath } from "@/lib/chain";
import { Directory } from "@/types/directory";

import { ethDriveAccountAbi } from "../../../contracts/shared/app/abi";

export function useWalletConnect(
  selectedDirectory: Directory,
  handleTransactionAsDirectory: (
    callData: Hex,
    destinationPath?: string,
    callback?: any,
  ) => void,
) {
  const [web3wallet, setWeb3Wallet] = useState<any>();
  const [uri, setUri] = useState("");
  const [proposerName, setProposerName] = useState("");
  const [proposerUrl, setProposerUrl] = useState("");
  const [proposerIcon, setProposerIcon] = useState("");
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [topic, setTopic] = useState("");
  const sessionEstablished = useRef(false);

  const init = () => {
    if (sessionEstablished.current && web3wallet && topic) {
      console.log("walletConnect: disconnect");
      try {
        web3wallet.disconnectSession({
          topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      } catch (error) {
        console.log("walletConnect: error", error);
      }
      setWeb3Wallet(undefined);
      setUri("");
      setTopic("");
      setProposerName("");
      setProposerUrl("");
      setProposerIcon("");
      setTo("");
      setValue("");
      setData("");
      sessionEstablished.current = false;
    }

    if (!selectedDirectory || !selectedDirectory.tokenBoundAccount) {
      return;
    }

    const selectedDirectoryChainId = getChainIdFromPath(selectedDirectory.path);

    (async () => {
      console.log("walletConnect: init");
      const core = new Core({
        projectId:
          process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
          "3a8170812b534d0ff9d794f19a901d64",
      });
      const web3wallet = await Web3Wallet.init({
        core,
        metadata: {
          name: "EthDrive",
          description: "EthDrive Directory Account",
          url: "super-eth-drive.vercel.app",
          icons: ["https://super-eth-drive.vercel.app/logo.png"],
        },
      });
      setWeb3Wallet(web3wallet);
      console.log("walletConnect: setOnSessionProposal");
      web3wallet.on(
        "session_proposal",
        async ({ id, params }: Web3WalletTypes.SessionProposal) => {
          console.log("walletConnect: onSessionProposal", params);
          if (selectedDirectoryChainId !== 11155111) {
            throw new Error("Wallet Connect only supports sepolia chain");
          }
          try {
            const approvedNamespaces = buildApprovedNamespaces({
              proposal: params,
              supportedNamespaces: {
                eip155: {
                  chains: [`eip155:${selectedDirectoryChainId}`],
                  methods: ["eth_sendTransaction", "personal_sign"],
                  events: ["accountsChanged", "chainChanged"],
                  accounts: [
                    `eip155:${selectedDirectoryChainId}:${selectedDirectory.tokenBoundAccount}`,
                  ],
                },
              },
            });
            const { topic } = await web3wallet.approveSession({
              id,
              namespaces: approvedNamespaces,
            });
            console.log("walletConnect: session approved", topic);
            setProposerName(params.proposer.metadata.name);
            setProposerUrl(params.proposer.metadata.url);
            setProposerIcon(params.proposer.metadata.icons[0]);
            setTopic(topic);
            sessionEstablished.current = true; // Mark session as established
          } catch (error) {
            console.log("walletConnect: error", error);
            await web3wallet.rejectSession({
              id: id,
              reason: getSdkError("USER_REJECTED"),
            });
          }
        },
      );
      console.log("walletConnect: setEthSendTransaction");
      web3wallet.on(
        "session_request",
        async (event: Web3WalletTypes.SessionRequest) => {
          const { topic, params, id } = event;
          console.log(topic, params, id);
          if (params.request.method != "eth_sendTransaction") {
            throw new Error("Unsupported method");
          }
          const [{ to, value, data }] = params.request.params;
          console.log("to", to);
          console.log("value", value);
          console.log("data", data);
          setTo(to);
          setValue(value);
          setData(data);
          const callData = encodeFunctionData({
            abi: ethDriveAccountAbi,
            functionName: "execute",
            args: [to, value ? fromHex(value, "bigint") : BigInt(0), data],
          });
          console.log("callData", callData);
          await handleTransactionAsDirectory(
            callData,
            "",
            async (hash: string) => {
              const response = { id, result: hash, jsonrpc: "2.0" };
              await web3wallet.respondSessionRequest({ topic, response });
            },
          );
        },
      );
    })();
  };

  useEffect(() => {
    init();
  }, [selectedDirectory]);

  const refresh = () => {
    init();
  };

  return {
    web3wallet,
    uri,
    setUri,
    proposerName,
    proposerUrl,
    proposerIcon,
    to,
    value,
    data,
    refresh,
  };
}
