import { config } from "./config";

export type ChainId = keyof typeof config;

export function isChainId(chainId?: string): chainId is ChainId {
  return Object.keys(config).includes(chainId as ChainId);
}
