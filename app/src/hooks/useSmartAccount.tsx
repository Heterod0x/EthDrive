"use client";

import { createSmartAccountClient } from "@alchemy/aa-core";
import { baseSepolia, optimismSepolia, sepolia } from "@alchemy/aa-core";
import { useMemo } from "react";
import { http } from "viem";

import { getRpcUrl } from "@/lib/alchemy";

import { config } from "../../../contracts/shared/app/config";
import { isChainId } from "../../../contracts/shared/app/types";

export function useSmartAccount(chainId?: number) {
  const smartAccountClient = useMemo(() => {
    const _chainId = chainId?.toString();
    if (!isChainId(_chainId)) {
      console.log("not a chainId");
      return;
    }
    const { alchemyChainName } = config[_chainId];
    let chain;
    if (alchemyChainName === "eth-sepolia") {
      chain = sepolia;
    } else if (alchemyChainName === "opt-sepolia") {
      chain = optimismSepolia;
    } else if (alchemyChainName === "base-sepolia") {
      chain = baseSepolia;
    } else {
      return;
    }
    return createSmartAccountClient({
      transport: http(getRpcUrl(alchemyChainName)) as any, // to bypass type issue
      chain,
    });
  }, [chainId]);

  return {
    smartAccountClient,
  };
}
