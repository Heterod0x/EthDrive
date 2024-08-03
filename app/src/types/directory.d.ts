export interface Directory {
  id: string;
  name: string;
  tokenId: string;
  tokenBountAccount: string;
  holder: string;
  subdirectories: Directory[];
  depth: number;
}
