import { baseSepolia, optimismSepolia, sepolia } from "@account-kit/infra";
import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
} from "@account-kit/react";
import { QueryClient } from "@tanstack/react-query";

import { config } from "../../../contracts/shared/app/config";

const alchemyKey =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "vzXI1-6dtYrvErKC7Q_KeiFLodiTojGg";

export function getRpcUrl(network: string) {
  return `https://${network}.g.alchemy.com/v2/${alchemyKey}`;
}

export async function request(network: string, method: string, params: any) {
  const res = await fetch(getRpcUrl(network), {
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

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [[{ type: "email" as const }], [{ type: "passkey" as const }]],
    addPasskeyOnSignup: true,
  },
};

export const alchemyConfig = createConfig(
  {
    apiKey: alchemyKey, // TODO: add your Alchemy API key - setup your app and embedded account config in the alchemy dashboard (https://dashboard.alchemy.com/accounts) - if you don't want to leak api keys, you can proxy to a backend and set the rpcUrl instead here
    chain: sepolia,
    chains: [
      {
        chain: sepolia,
        policyId: config["11155111"].alchemyGasManagerPolicyId,
      },
      {
        chain: optimismSepolia,
        policyId: config["11155420"].alchemyGasManagerPolicyId,
      },
      {
        chain: baseSepolia,
        policyId: config["84532"].alchemyGasManagerPolicyId,
      },
    ],
    ssr: true, // defers hydration of the account state to the client after the initial mount solving any inconsistencies between server and client state (read more here: https://accountkit.alchemy.com/react/ssr)
    storage: cookieStorage, // persist the account state using cookies (read more here: https://accountkit.alchemy.com/react/ssr#persisting-the-account-state)
  },
  uiConfig,
);

export const alchemyChains = {
  "11155111": sepolia,
  "11155420": optimismSepolia,
  "84532": baseSepolia,
};
