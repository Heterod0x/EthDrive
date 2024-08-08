"use client";

import { createSmartAccountClient } from "@alchemy/aa-core";
import { baseSepolia, optimismSepolia, sepolia } from "@alchemy/aa-core";
import { useMemo } from "react";
import { http } from "viem";
import { usePublicClient } from "wagmi";

import { getRpcUrl } from "@/lib/alchemy";

import { addresses } from "../../../contracts/shared/app/addresses";
import { config } from "../../../contracts/shared/app/config";
import { isChainId } from "../../../contracts/shared/app/types";

export function useChain(chainId?: number) {
  const chainPublicClient = usePublicClient({ chainId });

  const chainSmartAccountClient = useMemo(() => {
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

  const chainConfig = useMemo(() => {
    const _chainId = chainId?.toString();
    if (!isChainId(_chainId)) {
      return;
    }
    return config[_chainId];
  }, [chainId]);

  const chainAddresses = useMemo(() => {
    const _chainId = chainId?.toString();
    if (!isChainId(_chainId)) {
      return;
    }
    return addresses[_chainId];
  }, [chainId]);

  return {
    chainPublicClient,
    chainSmartAccountClient,
    chainConfig,
    chainAddresses,
  };
}
