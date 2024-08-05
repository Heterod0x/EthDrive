import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { Address } from "viem";

import { chainPublicClients } from "@/lib/chain";
import {
  MAX_DIRECTORY_DEPTH,
  adjustDirectoryDepth,
  buildRecursiveDirectoryQuery,
  formatPathesFromContract,
} from "@/lib/directory";
import { CreatedDirectoryFromContract, Directory } from "@/types/directory";
import { File } from "@/types/file";

import { ethDriveAbi } from "../../../contracts/shared/app/abi";
import { addresses } from "../../../contracts/shared/app/addresses";
import { config } from "../../../contracts/shared/app/config";
import { ChainId } from "../../../contracts/shared/app/types";

export const sepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
});

export function useDirectory(path = "root", connectedAddress?: Address) {
  const [rootDirectory, setRootDirectory] = useState<Directory>({
    path: "root",
    name: "root",
    subdirectories: [
      {
        path: "root/tenderly-virtual-testnet",
        name: "tenderly-virtual-testnet",
        subdirectories: [],
        depth: 1,
        files: [],
      },
      {
        path: "root/sepolia",
        name: "sepolia",
        subdirectories: [],
        depth: 1,
        files: [],
      },
    ],
    files: [],
    depth: 0,
    isExpandedByDefault: true,
  });
  const [selectedDirectoryPath, setSelectedDirectoryPath] = useState(path);
  const [selectedDirectory, setSelectedDirectory] =
    useState<Directory>(rootDirectory);

  const { data: dataSepolia, loading: loadingSepolia } = useQuery(
    gql`
      ${buildRecursiveDirectoryQuery(MAX_DIRECTORY_DEPTH)}
    `,
    {
      client: sepoliaClient,
    },
  );

  useEffect(() => {
    if (!loadingSepolia) {
      setRootDirectory((prev) => ({
        ...prev,
        subdirectories: prev.subdirectories.map((chainDir) =>
          chainDir.path === "root/sepolia"
            ? {
                ...chainDir,
                subdirectories:
                  dataSepolia.directories.map((subDir: Directory) =>
                    adjustDirectoryDepth(subDir, 2, "root/sepolia"),
                  ) || [],
              }
            : chainDir,
        ),
      }));
    }
  }, [dataSepolia, loadingSepolia]);

  useEffect(() => {
    (async function () {
      try {
        const createdDirectoriesFromContract = await chainPublicClients[
          "9999999"
        ].readContract({
          abi: ethDriveAbi,
          address: addresses["9999999"].ethDrive,
          functionName: "getCreatedDirectories",
        });
        const directoriesFromContract = formatPathesFromContract(
          createdDirectoriesFromContract as unknown as CreatedDirectoryFromContract[],
        );
        setRootDirectory((prev) => ({
          ...prev,
          subdirectories: prev.subdirectories.map((chainDir) =>
            chainDir.path === "root/tenderly-virtual-testnet"
              ? {
                  ...chainDir,
                  subdirectories: directoriesFromContract.map((subDir) =>
                    adjustDirectoryDepth(
                      subDir,
                      2,
                      "root/tenderly-virtual-testnet",
                    ),
                  ),
                }
              : chainDir,
          ),
        }));
      } catch (error) {
        console.error("Error fetching virtual directories:", error);
      }
    })();
  }, []);

  const getChainIdFromPath = (path: string) => {
    const network = path.split("/")[1];
    const idToChainIdMap = Object.entries(config).reduce(
      (acc, [chainId, details]) => {
        acc[details.path] = chainId;
        return acc;
      },
      {} as { [key: string]: string },
    );
    const chainId = idToChainIdMap[network];
    if (!chainId) {
      return undefined;
    }
    return Number(chainId);
  };

  const getFiles = async (directory: Directory): Promise<File[]> => {
    const _chainId = getChainIdFromPath(directory.path) as number;
    const chainId = _chainId.toString() as ChainId;
    const tokenBoundAccount = directory.tokenBoundAccount as Address;
    const balance = await chainPublicClients[chainId].getBalance({
      address: tokenBoundAccount,
    });
    return [{ type: "native", balance: balance }];
  };

  useEffect(() => {
    const findDirectory = (
      dir: Directory,
      path: string[],
    ): Directory | null => {
      if (path.length === 0) return dir;
      const [currentSegment, ...remainingPath] = path;
      const subDir = dir.subdirectories.find((d) => d.name === currentSegment);
      return subDir ? findDirectory(subDir, remainingPath) : null;
    };
    const pathSegments = selectedDirectoryPath.split("/").slice(1);
    const foundDirectory = findDirectory(rootDirectory, pathSegments);
    if (foundDirectory) {
      if (foundDirectory.depth >= 2) {
        (async () => {
          const files = await getFiles(foundDirectory);
          setSelectedDirectory({
            ...foundDirectory,
            files,
          });
        })();
      } else {
        setSelectedDirectory(foundDirectory);
      }
    }
  }, [selectedDirectoryPath, rootDirectory]);

  const selectedDirectoryChainId = useMemo(() => {
    return getChainIdFromPath(selectedDirectoryPath);
  }, [selectedDirectoryPath]);

  const connectedAddressDirectory = useMemo(() => {
    const filterConnectedAddressDirectories = (dir: Directory): Directory => {
      return {
        ...dir,
        subdirectories: dir.subdirectories
          .filter(
            (subDir) =>
              subDir.holder?.toLowerCase() === connectedAddress?.toLowerCase(),
          )
          .map(filterConnectedAddressDirectories),
      };
    };
    return {
      ...rootDirectory,
      subdirectories: rootDirectory.subdirectories.map((chainDir) => ({
        ...chainDir,
        subdirectories:
          filterConnectedAddressDirectories(chainDir).subdirectories,
      })),
    };
  }, [rootDirectory, connectedAddress]);

  return {
    rootDirectory,
    selectedDirectory,
    selectedDirectoryPath,
    selectedDirectoryChainId,
    connectedAddressDirectory,
    setSelectedDirectoryPath,
  };
}
