"use client";

import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import { useRef } from "react";
import { Button } from "./ui/button";

const appId = process.env.NEXT_PUBLIC_WORLD_ID_APP_ID as `app_${string}`;
const action = process.env.NEXT_PUBLIC_WORLD_ID_ACTION!;

type Props = {
  signal: string; // arbitarary value for proof 証明作成時に渡す任意の値
  onProofGenerated?: (proof: WorldIdProof) => void;
};

type WorldIdProof = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

export const WorldIDProver = ({ signal, onProofGenerated }: Props) => {
  const proofRef = useRef<WorldIdProof | null>(null);

  const verifyProof = async (proof: WorldIdProof) => {
    proofRef.current = proof;
  };

  const onSuccess = () => {
    console.log("debug::proof is generated", proofRef.current);
    onProofGenerated?.(proofRef.current!);
  };

  return (
      <IDKitWidget
        verification_level={VerificationLevel.Device}
        app_id={appId}
        action={action}
        signal={signal}
        handleVerify={verifyProof}
        onSuccess={onSuccess}
      >
        {({ open }) => <Button onClick={open}>Verify with World ID</Button>}
      </IDKitWidget>
  );
};
