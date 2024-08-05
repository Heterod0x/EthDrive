import { Directory, SolidityDirectory } from "@/types/directory";

export const MAX_DIRECTORY_DEPTH = process.env.NEXT_PUBLIC_MAX_DIRECTORY_DEPTH
  ? Number(process.env.NEXT_PUBLIC_MAX_DIRECTORY_DEPTH)
  : 5;

export function buildRecursiveDirectoryQuery(maxDepth: number) {
  function generateSubdirectoryFields(
    currentDepth: number,
    maxDepth: number,
  ): string {
    if (currentDepth > maxDepth) {
      return "";
    }
    return `
        subdirectories {
          path
          name
          tokenId
          tokenBoundAccount
          holder
          depth
          ${generateSubdirectoryFields(currentDepth + 1, maxDepth)}
        }
      `;
  }
  const query = `
      query RecursiveMyDirectory {
        directories(where: { depth: 0 }) {
          path
          name
          tokenId
          tokenBoundAccount
          holder
          depth
          ${generateSubdirectoryFields(1, maxDepth)}
        }
      }
    `;
  return query;
}

export function formatPathesFromContract(
  directoriesFromContract: SolidityDirectory[],
): Directory[] {
  const directoryMap = new Map<string, Directory>();
  directoriesFromContract.forEach((dir) => {
    const parts = dir.path.split("/").filter(Boolean);
    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath += index === 0 ? part : `/${part}`;
      if (!directoryMap.has(currentPath)) {
        directoryMap.set(currentPath, {
          path: currentPath,
          name: part,
          tokenId: "",
          tokenBoundAccount: "",
          holder: "",
          subdirectories: [],
          depth: index,
        });
      }
    });
  });
  directoriesFromContract.forEach((dir) => {
    const dirObj = directoryMap.get(dir.path);
    if (dirObj) {
      dirObj.tokenId = dir.tokenId?.toString();
      dirObj.tokenBoundAccount = dir.tokenBoundAccount;
      dirObj.holder = dir.holder;
    }
  });
  directoryMap.forEach((dir, path) => {
    const parentPath = path.substring(0, path.lastIndexOf("/"));
    if (parentPath) {
      const parentDir = directoryMap.get(parentPath);
      if (parentDir) {
        parentDir.subdirectories.push(dir);
      }
    }
  });
  return Array.from(directoryMap.values()).filter((dir) => dir.depth === 0);
}

export function adjustDirectoryDepth(
  directory: Directory,
  depthAdjustment: number,
  parentPath: string = "",
): Directory {
  const newPath = parentPath
    ? `${parentPath}/${directory.name}`
    : directory.path;
  return {
    ...directory,
    path: newPath,
    depth: directory.depth + depthAdjustment,
    subdirectories: directory.subdirectories.map((subDir) =>
      adjustDirectoryDepth(subDir, depthAdjustment, newPath),
    ),
  };
}
