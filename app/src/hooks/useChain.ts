"use client";

import { useMemo } from "react";
import { addresses } from "../../../contracts/shared/app/addresses";
import { config } from "../../../contracts/shared/app/config";
import { isChainId } from "../../../contracts/shared/app/types";
import { usePublicClient } from "wagmi";

export function useChain(chainId?: number) {
  const chainPublicClient = usePublicClient({ chainId });

  const chainAddresses = useMemo(() => {
    const _chainId = chainId?.toString();
    if (!isChainId(_chainId)) {
      return;
    }
    return addresses[_chainId];
  }, [chainId]);

  const chainConfig = useMemo(() => {
    const _chainId = chainId?.toString();
    if (!isChainId(_chainId)) {
      return;
    }
    return config[_chainId];
  }, [chainId]);

  return { chainAddresses, chainConfig, chainPublicClient };
}
