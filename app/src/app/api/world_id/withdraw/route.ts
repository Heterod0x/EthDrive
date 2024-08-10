import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";

import ABI from "@/constants/abis/GasDepositManager.json";

const customRollupRpc = process.env.NEXT_PUBLIC_CUSTOM_ROLLUP_RPC;
const gasDepositManagerAddress =
  process.env.NEXT_PUBLIC_GAS_DEPOSIT_MANAGER_ADDRESS;
const ownerKey = process.env.GAS_DEPOSIT_MANAGER_OWNER_KEY;

type Request = {
  account: string;
  fee: string; // amount * 10^18
  currency?: 'eth' | 'usd'
};

export async function POST(req: NextRequest) {
  const body: Request = await req.json();
  const { account, fee, currency = 'eth' } = body;

  console.log("account", account);
  console.log("fee", fee);

  const provider = new ethers.JsonRpcProvider(customRollupRpc);
  const signer = new ethers.Wallet(ownerKey!, provider);
  const contract = new ethers.Contract(
    gasDepositManagerAddress!,
    ABI,
    provider,
  ).connect(signer);

  try {
    if (currency === 'eth') {
      const tx = await contract.getFunction("withdrawFee")(account!, BigInt(fee));
      console.log(`sending withdraw tx, hash => ${tx.hash}`);
  
      const receipt = await tx.wait();  
      console.log(`withdrew status => ${receipt.status}`);
      
      return NextResponse.json({
        ok: true,
        hash: tx.hash,
      });
    } else if (currency === 'usd') {
      const pythPriceService = new EvmPriceServiceConnection(
        "https://hermes.pyth.network"
      );
      const priceFeedUpdateData = await pythPriceService.getPriceFeedsUpdateData([
        // ETH/USD
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
      ]);
      console.log('got price feed data for ETH/USD from pyth', priceFeedUpdateData);

      const tx = await contract.getFunction("withdrawFeeInUsd")(account!, BigInt(fee), priceFeedUpdateData);
      console.log(`sending withdraw tx, hash => ${tx.hash}`);
  
      const receipt = await tx.wait();  
      console.log(`withdrew status => ${receipt.status}`);
      
      return NextResponse.json({
        ok: true,
        hash: tx.hash,
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: `invalid currency: ${currency}`
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.toString(),
    });
  }
}