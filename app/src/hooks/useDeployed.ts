"use client";

import { useMemo } from "react";
import { addresses } from "../../../contracts/shared/app/addresses";
import { isChainId } from "../../../contracts/shared/app/types";

export function useDeployedAddresses(_chainId?: number) {
  const deployedAddresses = useMemo(() => {
    const chainId = _chainId?.toString();
    if (!isChainId(chainId)) {
      return;
    }
    return addresses[chainId];
  }, [_chainId]);

  return { deployedAddresses };
}
