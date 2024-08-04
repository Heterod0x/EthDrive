import { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";

import {
  buildRecursiveDirectoryQuery,
  parseVirtualDirectories,
} from "@/lib/utils";
import { ethDriveAbi } from "../../../contracts/shared/app/abi";
import { addresses } from "../../../contracts/shared/app/addresses";

import { virtualChain } from "@/lib/chain";
import { createPublicClient, http } from "viem";
import { Directory, SolidityDirectory } from "@/types/directory";

export const sepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
});

export const virtualClient = createPublicClient({
  chain: virtualChain,
  transport: http(),
});

const MAX_DEPTH = 5;

function adjustDepth(directory: Directory, depthAdjustment: number): Directory {
  return {
    ...directory,
    depth: directory.depth + depthAdjustment,
    subdirectories: directory.subdirectories.map((subDir) =>
      adjustDepth(subDir, depthAdjustment)
    ),
  };
}

export function useRootDirectory() {
  const [rootDirectory, setRootDirectory] = useState<Directory>({
    path: "root",
    name: "root",
    subdirectories: [
      {
        path: "root/virtual",
        name: "virtual",
        subdirectories: [],
        depth: 1,
      },
      {
        path: "root/sepolia",
        name: "sepolia",
        subdirectories: [],
        depth: 1,
      },
    ],
    depth: 0,
  });
  const [loading, setLoading] = useState(true);

  const query = gql`
    ${buildRecursiveDirectoryQuery(MAX_DEPTH)}
  `;

  const { data: dataSepolia, loading: loadingSepolia } = useQuery(query, {
    client: sepoliaClient,
  });

  useEffect(() => {
    if (!loadingSepolia) {
      setLoading(false);
      setRootDirectory((prev) => ({
        ...prev,
        subdirectories: prev.subdirectories.map((chainDir) =>
          chainDir.path === "root/sepolia"
            ? {
                ...chainDir,
                subdirectories:
                  dataSepolia.directories.map((subDir: Directory) =>
                    adjustDepth(
                      {
                        ...subDir,
                        path: `root/sepolia${subDir.path}`,
                      },
                      2
                    )
                  ) || [],
              }
            : chainDir
        ),
      }));
    }
  }, [dataSepolia, loadingSepolia]);

  useEffect(() => {
    async function fetchData() {
      try {
        const virtualPaths = await virtualClient.readContract({
          abi: ethDriveAbi,
          address: addresses["9999999"].ethDrive,
          functionName: "getCreatedDirectories",
        });
        const virtualDirectories = parseVirtualDirectories(
          virtualPaths as unknown as SolidityDirectory[]
        );
        console.log("virtualDirectories", virtualDirectories);

        setRootDirectory((prev) => ({
          ...prev,
          subdirectories: prev.subdirectories.map((chainDir) =>
            chainDir.path === "root/virtual"
              ? {
                  ...chainDir,
                  subdirectories: virtualDirectories.map((subDir) =>
                    adjustDepth(
                      {
                        ...subDir,
                        path: `root/virtual${subDir.path}`,
                      },
                      2
                    )
                  ),
                }
              : chainDir
          ),
        }));
      } catch (error) {
        console.error("Error fetching virtual directories:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { rootDirectory, loading };
}
