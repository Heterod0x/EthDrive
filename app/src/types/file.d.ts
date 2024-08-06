export type FileType = "native" | "ccip";

export type File = {
  type: FileType;
  chainId?: number;
  address: string;
  amount: string;
};
