"use client";

import { useMemo } from "react";
import { config } from "../../../contracts/shared/app/config";
import { ChainId, isChainId } from "../../../contracts/shared/app/types";

export function useSelectedDirectiryChainConfig(path: string) {
  const selectedDirectoryChainConfig = useMemo(() => {
    const network = path.split("/")[1];
    const idToChainIdMap = Object.entries(config).reduce(
      (acc, [chainId, details]) => {
        acc[details.id] = chainId;
        return acc;
      },
      {} as { [key: string]: string }
    );
    const chainId = idToChainIdMap[network];
    if (!isChainId) {
      return;
    }
    return config[chainId as ChainId];
  }, [path]);
  return { selectedDirectoryChainConfig };
}
