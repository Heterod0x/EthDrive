export type FileType = "native" | "weth" | "ccip";

export type File = {
  type: FileType;
  chainId?: number;
  address: string;
  amount: string;
};
