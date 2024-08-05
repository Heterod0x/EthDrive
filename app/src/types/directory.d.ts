import { File } from "@/types/file";

export type Directory = {
  path: string;
  name: string;
  tokenId?: string;
  tokenBoundAccount?: string;
  holder?: string;
  subdirectories: Directory[];
  files: File[];
  depth: number;
  isExpandedByDefault?: boolean;
};

export type CreatedDirectoryFromContract = Pick<
  Directory,
  "path" | "tokenId" | "tokenBoundAccount" | "holder"
>;
