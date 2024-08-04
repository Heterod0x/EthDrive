import { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";

import {
  buildRecursiveDirectoryQuery,
  parseVirtualDirectories,
} from "@/lib/utils";
import { Directory, SolidityDirectory } from "@/types/directory";
import { ethDriveAbi } from "../../../contracts/shared/app/abi";
import { addresses } from "../../../contracts/shared/app/addresses";

import { virtualChain } from "@/lib/chain";
import { createPublicClient, http } from "viem";

export const sepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
});

export const virtualClient = createPublicClient({
  chain: virtualChain,
  transport: http(),
});

const MAX_DEPTH = 5;

export function useDirectories() {
  const [directories, setDirectories] = useState<{
    virtual: Directory[];
    sepolia: Directory[];
  }>({
    virtual: [],
    sepolia: [],
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
      setDirectories((prev) => ({
        ...prev,
        sepolia: dataSepolia.directories || [],
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
        setDirectories((prev) => ({
          ...prev,
          virtual: virtualDirectories,
        }));
      } catch (error) {
        console.error("Error fetching virtual directories:", error);
      }
    }
    fetchData();
  }, []);

  return { directories, loading };
}
