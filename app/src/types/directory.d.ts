export type Directory = {
  path: string;
  name: string;
  tokenId?: string;
  tokenBoundAccount?: string;
  holder?: string;
  subdirectories: Directory[];
  ethAmount?: string;
  depth: number;
  isExpandedByDefault?: boolean;
};

export type CreatedDirectoryFromContract = Pick<
  Directory,
  "path" | "tokenId" | "tokenBoundAccount" | "holder"
>;
