type Directory = {
  path: string;
  name: string;
  tokenId?: string;
  tokenBoundAccount?: string;
  holder?: string;
  subdirectories: Directory[];
  depth: number;
};

export type SolidityDirectory = Pick<
  Directory,
  "path" | "tokenId" | "tokenBoundAccount" | "holder"
>;
