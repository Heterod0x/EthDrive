export type ChainId = "11155111";

export function isChainId(chainId?: string): chainId is ChainId {
  return chainId === "11155111";
}
