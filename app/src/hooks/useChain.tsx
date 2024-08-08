"use client";

import { useMemo } from "react";
import { usePublicClient } from "wagmi";

import { alchemyChains } from "@/lib/alchemy";

import { addresses } from "../../../contracts/shared/app/addresses";
import { config } from "../../../contracts/shared/app/config";
import { isChainId } from "../../../contracts/shared/app/types";

export function useChain(chainId?: number) {
  const chainPublicClient = usePublicClient({ chainId });

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

  const alchemyChain = useMemo(() => {
    const _chainId = chainId?.toString() as keyof typeof alchemyChains;
    return alchemyChains[_chainId];
  }, [chainId]);

  return {
    chainPublicClient,
    chainConfig,
    chainAddresses,
    alchemyChain,
  };
}
