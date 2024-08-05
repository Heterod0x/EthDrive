export type FileType = "native" | "erc20" | "erc721" | "erc1155";

export type File = {
  type: FileType;
  amount: string;
};
