"use client";

import { useMemo } from "react";
import { addresses } from "../../../contracts/shared/app/addresses";
import { isChainId } from "../../../contracts/shared/app/types";
import { useAccount } from "wagmi";

export function useConnectedChainAddresses() {
  const { chainId: _chainId } = useAccount();

  const connectedChainAddresses = useMemo(() => {
    const chainId = _chainId?.toString();
    if (!isChainId(chainId)) {
      return;
    }
    return addresses[chainId];
  }, [_chainId]);

  return { connectedChainAddresses };
}
