const validChainIds = ["11155111", "9999999"] as const;

export type ChainId = (typeof validChainIds)[number];

export function isChainId(chainId?: string): chainId is ChainId {
  return validChainIds.includes(chainId as ChainId);
}
