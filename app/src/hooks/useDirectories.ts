import { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";

// Dynamic query generation function
import { buildRecursiveDirectoryQuery } from "@/lib/graphql";
import { Directory } from "@/types/directory";

export const sepoliaClient = new ApolloClient({
  uri: "https://api.goldsky.com/api/public/project_clzdlcfurx39f01wickedh49y/subgraphs/ethdrive-sepolia/0.0.1/gn",
  cache: new InMemoryCache(),
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
      setDirectories({
        sepolia: dataSepolia.directories || [],
        virtual: [],
      });
    }
  }, [dataSepolia, loadingSepolia]);

  return { directories, loading };
}
