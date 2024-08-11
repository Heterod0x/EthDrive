import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { config } from "../../../contracts/shared/app/config";
import { ccipBnMAbi } from "../../../contracts/shared/app/external-abi";
import { ChainId, isChainId } from "../../../contracts/shared/app/types";
import {
  chainlinkCCIPBnMAddresses,
  sepoliaWETHAddress,
} from "../../../contracts/shared/external-contract";

export const sepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
});

export const optimismSepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-optimism-sepolia/0.0.1/gn",
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
        path: "root/optimism-sepolia",
        name: "optimism-sepolia",
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
      {
        path: "root/mode-testnet",
        name: "mode-testnet",
        subdirectories: [],
        depth: 1,
        files: [],
      },
      {
        path: "root/celo-alfajores",
        name: "celo-alfajores",
        subdirectories: [],
        depth: 1,
        files: [],
      },
      {
        path: "root/metal-l2-testnet",
        name: "metal-l2-testnet",
        subdirectories: [],
        depth: 1,
        files: [],
      },
      {
        path: "root/fraxtal-mainnet",
        name: "fraxtal-mainnet",
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

  const { data: dataOptimismSepolia, loading: loadingOptimismSepolia } =
    useQuery(
      gql`
        ${buildRecursiveDirectoryQuery(MAX_DIRECTORY_DEPTH)}
      `,
      {
        client: optimismSepoliaClient,
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
                subdirectories: dataSepolia
                  ? dataSepolia.directories.map((subDir: Directory) =>
                      adjustDirectoryDepth(subDir, 2, "root/sepolia"),
                    )
                  : [],
              }
            : chainDir,
        ),
      }));
    }
  }, [dataSepolia, loadingSepolia]);

  useEffect(() => {
    if (!loadingOptimismSepolia) {
      setRootDirectory((prev) => ({
        ...prev,
        subdirectories: prev.subdirectories.map((chainDir) =>
          chainDir.path === "root/optimism-sepolia"
            ? {
                ...chainDir,
                subdirectories: dataOptimismSepolia
                  ? dataOptimismSepolia.directories.map((subDir: Directory) =>
                      adjustDirectoryDepth(subDir, 2, "root/optimism-sepolia"),
                    )
                  : [],
              }
            : chainDir,
        ),
      }));
    }
  }, [dataOptimismSepolia, loadingOptimismSepolia]);

  useEffect(() => {
    if (!loadingBaseSepolia) {
      setRootDirectory((prev) => ({
        ...prev,
        subdirectories: prev.subdirectories.map((chainDir) =>
          chainDir.path === "root/base-sepolia"
            ? {
                ...chainDir,
                subdirectories: dataBaseSepolia
                  ? dataBaseSepolia.directories.map((subDir: Directory) =>
                      adjustDirectoryDepth(subDir, 2, "root/base-sepolia"),
                    )
                  : [],
              }
            : chainDir,
        ),
      }));
    }
  }, [dataBaseSepolia, loadingBaseSepolia]);

  const fetchAndSetDirectories = async (chainId: ChainId, rootPath: string) => {
    try {
      const createdDirectoriesFromContract = await chainPublicClients[
        chainId
      ].readContract({
        abi: ethDriveAbi,
        address: addresses[chainId].ethDrive,
        functionName: "getCreatedDirectories",
      });

      const directoriesFromContract = formatPathesFromContract(
        createdDirectoriesFromContract as unknown as CreatedDirectoryFromContract[],
      );

      setRootDirectory((prev) => ({
        ...prev,
        subdirectories: prev.subdirectories.map((chainDir) =>
          chainDir.path === rootPath
            ? {
                ...chainDir,
                subdirectories: directoriesFromContract.map((subDir) =>
                  adjustDirectoryDepth(subDir, 2, rootPath),
                ),
              }
            : chainDir,
        ),
      }));
    } catch (error) {
      console.error(`Error fetching directories for ${rootPath}:`, error);
    }
  };

  useEffect(() => {
    fetchAndSetDirectories("9999999", "root/tenderly-virtual-testnet");
  }, []);

  useEffect(() => {
    fetchAndSetDirectories("919", "root/mode-testnet");
  }, []);

  useEffect(() => {
    fetchAndSetDirectories("44787", "root/celo-alfajores");
  }, []);

  useEffect(() => {
    fetchAndSetDirectories("1740", "root/metal-l2-testnet");
  }, []);

  useEffect(() => {
    fetchAndSetDirectories("252", "root/fraxtal-mainnet");
  }, []);

  const getFiles = useCallback(
    async (directory: Directory): Promise<File[]> => {
      const _chainId = getChainIdFromPath(directory.path);
      const chainId = _chainId?.toString();
      if (!isChainId(chainId)) {
        return [];
      }
      const tokenBoundAccount = directory.tokenBoundAccount as Address;
      const files: File[] = [];
      const balance = await chainPublicClients[chainId].getBalance({
        address: tokenBoundAccount,
      });
      if (balance > 0) {
        files.push({
          type: "native",
          chainId: _chainId,
          address: "",
          amount: balance.toString(),
        });
      }
      if (chainId === "11155111") {
        console.log("get weth");
        const wethBalance = await chainPublicClients[chainId].readContract({
          abi: ccipBnMAbi, // reuse this abi
          address: sepoliaWETHAddress,
          functionName: "balanceOf",
          args: [tokenBoundAccount],
        });
        if (wethBalance > 0) {
          files.push({
            type: "weth",
            chainId: _chainId,
            address: sepoliaWETHAddress,
            amount: wethBalance.toString(),
          });
        }
      }
      if (
        connectedAddress &&
        config[chainId].isCCIPEnabled &&
        chainlinkCCIPBnMAddresses[
          chainId as keyof typeof chainlinkCCIPBnMAddresses
        ]
      ) {
        console.log("connectedAddress", connectedAddress);
        const chainlinkCCIPBnMAddress = chainlinkCCIPBnMAddresses[
          chainId as keyof typeof chainlinkCCIPBnMAddresses
        ] as Address;
        const ccipBalance = await chainPublicClients[chainId].readContract({
          abi: ccipBnMAbi,
          address: chainlinkCCIPBnMAddress,
          functionName: "balanceOf",
          args: [tokenBoundAccount],
        });
        if (ccipBalance > 0) {
          files.push({
            type: "ccip",
            chainId: _chainId,
            address: chainlinkCCIPBnMAddress,
            amount: ccipBalance.toString(),
          });
        }
      }
      return files;
    },
    [connectedAddress],
  );

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
