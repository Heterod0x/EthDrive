import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import ABI from "@/constants/abis/GasDepositManager.json";

const customRollupRpc = process.env.NEXT_PUBLIC_CUSTOM_ROLLUP_RPC;
const gasDepositManagerAddress = process.env.NEXT_PUBLIC_GAS_DEPOSIT_MANAGER_ADDRESS;
const ownerKey = process.env.GAS_DEPOSIT_MANAGER_OWNER_KEY;

type Request = {
    account: string;
    fee: string;
}

export async function POST(req: NextRequest) {
  const body: Request = await req.json();
  const {account, fee} = body;

  const provider = new ethers.JsonRpcProvider(customRollupRpc);
  const signer = new ethers.Wallet(ownerKey!, provider);
  const contract = new ethers.Contract(gasDepositManagerAddress!, ABI, provider)
  .connect(signer);

  try {
    const tx = await contract.getFunction('withdrawFee')(
      account!,
      BigInt(fee),
    );

    console.log(`sending withdraw tx, hash => ${tx.hash}`);

    const receipt = await tx.wait();

    console.log(`withdrew status => ${receipt.status}`);

    return NextResponse.json({
      ok: true,
      hash: tx.hash,
    });
  } catch(error: any) {
    return NextResponse.json({
      ok: false,
      error: error.toString(),
    });
  } 
}
