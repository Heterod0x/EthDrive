import { Directory, SolidityDirectory } from "@/types/directory";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildRecursiveDirectoryQuery(maxDepth: number) {
  function generateSubdirectoryFields(
    currentDepth: number,
    maxDepth: number
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

export function parseVirtualDirectories(
  solidityDirectories: SolidityDirectory[]
): Directory[] {
  const directoryMap = new Map<string, Directory>();

  // First, create all directory objects
  solidityDirectories.forEach((dir) => {
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

  // Then, assign the correct data and build the tree structure
  solidityDirectories.forEach((dir) => {
    console.log("dir.path", dir.path);
    const dirObj = directoryMap.get(dir.path);
    console.log("dirObj", dirObj);

    if (dirObj) {
      dirObj.tokenId = dir.tokenId;
      dirObj.tokenBoundAccount = dir.tokenBoundAccount;
      dirObj.holder = dir.holder;
    }
  });

  console.log("directoryMap", directoryMap);

  // Build the tree structure
  directoryMap.forEach((dir, path) => {
    const parentPath = path.substring(0, path.lastIndexOf("/"));
    if (parentPath) {
      const parentDir = directoryMap.get(parentPath);
      if (parentDir) {
        parentDir.subdirectories.push(dir);
      }
    }
  });

  // Return only top-level directories
  return Array.from(directoryMap.values()).filter((dir) => dir.depth === 0);
}
