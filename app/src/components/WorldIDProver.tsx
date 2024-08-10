"use client";

import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import { useRef } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const appId = process.env.NEXT_PUBLIC_WORLD_ID_APP_ID as `app_${string}`;
const action = process.env.NEXT_PUBLIC_WORLD_ID_ACTION!;

type Props = {
  address: string;
  checked?: boolean; // Switch on/off
  disabled?: boolean; // Disable toggle of switch
  skipVerification?: boolean; // Skip World ID verification
  verifying: boolean;
  onProofGenerated?: (proof: WorldIdProof) => void;
  onSwitchToggled: (nextStatus: boolean) => void;
};

type WorldIdProof = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

export const WorldIDProver = ({
  address,
  checked,
  disabled,
  skipVerification,
  verifying,
  onProofGenerated,
  onSwitchToggled,
}: Props) => {
  const proofRef = useRef<WorldIdProof | null>(null);

  const verifyProof = async (proof: WorldIdProof) => {
    proofRef.current = proof;
  };

  const onSuccess = () => {
    onProofGenerated?.(proofRef.current!);
  };

  return (
    <IDKitWidget
      verification_level={VerificationLevel.Orb}
      app_id={appId}
      action={action}
      signal={address ? address.substring(2) : ""}
      handleVerify={verifyProof}
      onSuccess={onSuccess}
    >
      {({ open }) => (
        <div className="flex items-cente space-x-2">
          <Switch
            checked={checked}
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }
              if (checked || skipVerification) {
                onSwitchToggled?.(!checked);

                return;
              }

              open();
            }}
          />
          <Label className="mt-1 ml-1" htmlFor="enable_world_id">
            {verifying && <>{"Verifying..."}</>}
            {!verifying && (
              <>
                {checked ? "Disable Gassless" : "Enable Gasless"}
                {!skipVerification && " (World ID verification required)"}
              </>
            )}
          </Label>
        </div>
      )}
    </IDKitWidget>
  );
};
