const alchemyKey =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

export async function request(network: string, method: string, params: any) {
  const res = await fetch(`https://${network}.g.alchemy.com/v2/${alchemyKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  });
  return await res.json();
}

// https://docs.alchemy.com/reference/account-abstraction-faq#what-is-a-dummy-signature-and-why-do-i-need-it-for-certain-endpoints
export const dummySignature =
  "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
