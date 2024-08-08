import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import ABI from "@/constants/abis/GasDepositManager.json";

const customRollupRpc = process.env.NEXT_PUBLIC_CUSTOM_ROLLUP_RPC;
const gasDepositManagerAddress = process.env.NEXT_PUBLIC_GAS_DEPOSIT_MANAGER_ADDRESS;

type Request = {
    account: string;
    fee: string;
}

export async function POST(req: NextRequest) {
  const body: Request = await req.json();
  const {account, fee} = body;

  const provider = new ethers.JsonRpcProvider(customRollupRpc);
  const contract = new ethers.Contract(gasDepositManagerAddress!, ABI, provider);

  // 1. Check if account has been verified by World ID and deposited
  const payable = await contract.isPayable(account);

  // 2. Check if account has deposited enough amount for fee
  const depositAmount = await contract.deposited(account);
  const hasEnoughDeposit = depositAmount > BigInt(fee);

  // 3. TODO: Create signature
  const signature = '0x...'

  return NextResponse.json({
    ok: payable && hasEnoughDeposit,
    signature,
  });
}
