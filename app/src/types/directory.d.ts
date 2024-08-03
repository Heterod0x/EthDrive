export interface Directory {
  path: string;
  name: string;
  tokenId: string;
  tokenBountAccount: string;
  holder: string;
  subdirectories: Directory[];
  depth: number;
}
