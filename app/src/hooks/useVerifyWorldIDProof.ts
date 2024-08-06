import { VerificationLevel } from "@worldcoin/idkit-core";
import { useCallback } from "react";

type WorldIdProof = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

type APIResponse = {
    ok: boolean;
}

// Returns a function to call an endpoint for verification of WorldID proof
export const useVerifyWorldIDProof = () => {
  return useCallback(async (signal: string, proof: WorldIdProof, account: string) => {
    const reqBody = {signal, proof, account};

    const rawResponse = await fetch("/api/world_id/verify", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const response: APIResponse = await rawResponse.json();

    return response.ok;
  }, []);
};
