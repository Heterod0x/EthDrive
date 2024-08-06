import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { Address } from "viem";

import { chainPublicClients, getChainIdFromPath } from "@/lib/chain";
import {
  MAX_DIRECTORY_DEPTH,
  adjustDirectoryDepth,
  buildRecursiveDirectoryQuery,
  findDirectory,
  formatPathesFromContract,
} from "@/lib/directory";
import { CreatedDirectoryFromContract, Directory } from "@/types/directory";
import { File } from "@/types/file";

import { ethDriveAbi } from "../../../contracts/shared/app/abi";
import { addresses } from "../../../contracts/shared/app/addresses";
import { isChainId } from "../../../contracts/shared/app/types";

export const sepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
});

export const baseSepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-base-sepolia/0.0.1/gn",
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
      {
        path: "root/base-sepolia",
        name: "base-sepolia",
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

  const { data: dataBaseSepolia, loading: loadingBaseSepolia } = useQuery(
    gql`
      ${buildRecursiveDirectoryQuery(MAX_DIRECTORY_DEPTH)}
    `,
    {
      client: baseSepoliaClient,
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
    if (!loadingBaseSepolia) {
      setRootDirectory((prev) => ({
        ...prev,
        subdirectories: prev.subdirectories.map((chainDir) =>
          chainDir.path === "root/base-sepolia"
            ? {
                ...chainDir,
                subdirectories:
                  dataBaseSepolia.directories.map((subDir: Directory) =>
                    adjustDirectoryDepth(subDir, 2, "root/base-sepolia"),
                  ) || [],
              }
            : chainDir,
        ),
      }));
    }
  }, [dataBaseSepolia, loadingBaseSepolia]);

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

  const getFiles = async (directory: Directory): Promise<File[]> => {
    const _chainId = getChainIdFromPath(directory.path);
    const chainId = _chainId?.toString();
    if (!isChainId(chainId)) {
      return [];
    }
    const tokenBoundAccount = directory.tokenBoundAccount as Address;
    const balance = await chainPublicClients[chainId].getBalance({
      address: tokenBoundAccount,
    });
    return [{ type: "native", amount: balance.toString() }];
  };

  useEffect(() => {
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
