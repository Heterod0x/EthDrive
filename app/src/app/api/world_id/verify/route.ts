import { NextRequest, NextResponse } from "next/server";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { verifyCloudProof } from "@worldcoin/idkit-core/backend";
import { ethers } from "ethers";

const appId = process.env.NEXT_PUBLIC_WORLD_ID_APP_ID as `app_${string}`;
const action = process.env.NEXT_PUBLIC_WORLD_ID_ACTION!;
const customRollupRpc = process.env.NEXT_PUBLIC_CUSTOM_ROLLUP_RPC;

type WorldIdProof = {
    proof: string;
    merkle_root: string;
    nullifier_hash: string;
    verification_level: VerificationLevel;
}

type Request = {
    signal: string; // arbitrary value for proof
    proof: WorldIdProof;
    account: string; // account address;
}

export async function POST(req: NextRequest) {
  const body: Request = await req.json();
  const {signal, proof, account} = body;

  // 1. Verify World ID proof
  const {success} = await verifyCloudProof(proof, appId, action, signal);

  // 2. Check account balance in custom rollup
  const provider = new ethers.JsonRpcProvider(customRollupRpc);
  const balance = await provider.getBalance(account);
  const hasBalance = balance > 0;

  return NextResponse.json({
    ok: success && hasBalance,
    body,
  });
}
