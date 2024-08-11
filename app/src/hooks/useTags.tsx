"use client";

import { ApolloClient, InMemoryCache, gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Address, checksumAddress } from "viem";

export const sepoliaEASClient = new ApolloClient({
  uri: "https://sepolia.easscan.org/graphql",
  cache: new InMemoryCache(),
});

const EXAMPLE_QUERY = gql`
  query TagQuery($where: AttestationWhereInput) {
    attestations(where: $where) {
      id
      decodedDataJson
    }
  }
`;

export function useTags(
  selectedDirectoryChainId?: number,
  connectedAddress?: Address,
  tokenBoundAccount?: Address,
) {
  const [tags, setTags] = useState<{ id: string; value: string }[]>([]);

  const { data } = useQuery(EXAMPLE_QUERY, {
    variables: {
      where: {
        attester: {
          equals: connectedAddress ? checksumAddress(connectedAddress) : "",
        },
        recipient: {
          equals: tokenBoundAccount ? checksumAddress(tokenBoundAccount) : "",
        },
        schemaId: {
          equals:
            "0x00e3e054d5f8f8f81c25009189773997ba5b4e082eba3edef2d93134dda7e81a",
        },
      },
    },
    client: sepoliaEASClient,
    skip:
      selectedDirectoryChainId !== 11155111 ||
      !connectedAddress ||
      !tokenBoundAccount,
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    const tags = data.attestations.map((attestation: any) => {
      const decodedData = JSON.parse(attestation.decodedDataJson);
      return { id: attestation.id, value: decodedData[0].value.value };
    });
    setTags(tags);
  }, [data]);

  return { tags };
}
