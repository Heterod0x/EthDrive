import {
  CreateRegistry as CreateRegistryEvent,
  EthDrive as EthDriveContract,
} from "../generated/EthDrive/EthDrive";
import { Directory } from "../generated/schema";

export function handleCreateRegistry(event: CreateRegistryEvent): void {
  const contract = EthDriveContract.bind(event.address);

  const path = event.params.path;
  const segments = path.split("/");
  let parentDirectory: Directory | null = null;
  for (let i = 0; i < segments.length; i++) {
    const id = segments.slice(0, i + 1).join("/");
    let directory = Directory.load(id);

    if (!directory) {
      directory = new Directory(id);
      const tokenId = contract.getTokenIdFromPath(path);
      directory.tokenId = tokenId;
      directory.tokenBountAccount = contract.getTokenBoundAccountFromTokenId(
        tokenId
      );
      directory.holder = contract.ownerOf(tokenId);
      directory.subdirectories = [];
    }

    if (parentDirectory) {
      let subdirs = parentDirectory.subdirectories;
      if (!subdirs.includes(directory.id)) {
        subdirs.push(directory.id);
        parentDirectory.subdirectories = subdirs;
        parentDirectory.save();
      }
    }

    directory.save();
    parentDirectory = directory;
  }
}
