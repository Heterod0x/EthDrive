import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

const IdentityManagerAbi = [
  "event TreeChanged(uint256 indexed preRoot, uint8 indexed kind, uint256 indexed postRoot)",
];

const BridgeABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newRoot",
        type: "uint256",
      },
    ],
    name: "receiveRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ethMainnetRpc = process.env.ETH_MAINNET_RPC;
const conduitRpc = process.env.NEXT_PUBLIC_CUSTOM_ROLLUP_RPC;

const ethMainnetWorldIdIdentityManagerAddress =
  process.env.ETH_MAINNET_WORLD_ID_IDENTITY_MANAGER;
const conduitWorldIdBridgeAddress = process.env.CONDUIT_WORLD_ID_BRIDGE;

const signerKey = process.env.GAS_DEPOSIT_MANAGER_OWNER_KEY;

export async function POST(_req: NextRequest) {
  const sourceProvider = new ethers.JsonRpcProvider(ethMainnetRpc);
  const latestBlockHeight = await sourceProvider.getBlockNumber();

  const destinationContract = new ethers.Contract(
    conduitWorldIdBridgeAddress!,
    BridgeABI,
    new ethers.JsonRpcProvider(conduitRpc),
  ).connect(
    new ethers.Wallet(signerKey!, new ethers.JsonRpcProvider(conduitRpc)),
  );

  let blockHeight = latestBlockHeight - 750; // 3 hours ago

  const iface = new ethers.Interface(IdentityManagerAbi);
  while (true) {
    const logs = await sourceProvider.getLogs({
      fromBlock: blockHeight,
      address: ethMainnetWorldIdIdentityManagerAddress,
      topics: [
        "0x25f6d5cc356ee0b49cf708c13c68197947f5740a878a298765e4b18e4afdaf04",
      ],
    });

    console.log("got IdentityManager logs", logs.length);

    for (const log of logs) {
      blockHeight = log.blockNumber;

      const txRecipet = await sourceProvider.getTransactionReceipt(
        log.transactionHash,
      );

      for (const log of txRecipet?.logs ?? []) {
        try {
          const res = iface.parseLog({
            data: log.data,
            topics: [...log.topics],
          });
          const postRoot = res?.args[2];

          // thrown if root is registered already
          const tx =
            await destinationContract.getFunction("receiveRoot")(postRoot);
          const receipt = await tx.wait();
          console.log(
            `updated root from height=${txRecipet?.blockNumber}, root=${postRoot}, status=${receipt.status}`,
          );
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (latestBlockHeight >= blockHeight) {
      break;
    }
  }

  return NextResponse.json({
    ok: true,
  });
}
