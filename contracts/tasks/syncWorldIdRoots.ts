import { task } from "hardhat/config";

const fromAbi = [
  "event TreeChanged(uint256 indexed preRoot, uint8 indexed kind, uint256 indexed postRoot)"
]

const targetAbi = [
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

task("syncWorldIdRoots", "Sync World ID merkle roots to bridged contract")
  .addParam("source", "JSON-RPC address for source chain")
  .addParam("from", "Address of World ID Identity Manager contract")
  .addParam("target", "JSON-RPC address for target chain")
  .addParam("dest", "Address of Bridged World ID contract")
  .setAction(async (taskArgs, hre) => {
    while(true) {
      console.log('start');

      const {source: sourceChainRpc, from: sourceContractAddress, target: targetChainRpc, dest: targetContractAddress} = taskArgs;

      const [signer] = await hre.ethers.getSigners();
  
      const sourceProvider = new hre.ethers.JsonRpcProvider(sourceChainRpc);
      const latestBlockHeight = await sourceProvider.getBlockNumber();
    
      const targetContract = new hre.ethers.Contract(
        targetContractAddress,
        targetAbi,
        new hre.ethers.JsonRpcProvider(targetChainRpc)
      ).connect(signer);
    
      let blockHeight = latestBlockHeight - 7200; // 1 day ago
    
      const iface = new hre.ethers.Interface(fromAbi);
      while(true) {
        const logs = await sourceProvider.getLogs({
          fromBlock: blockHeight,
          address: sourceContractAddress,
          topics: [
            '0x25f6d5cc356ee0b49cf708c13c68197947f5740a878a298765e4b18e4afdaf04'
          ],
        });
  
        console.log('get logs', logs.length);
    
        for(const log of logs) {
          blockHeight = log.blockNumber;
    
          const txRecipet = await sourceProvider.getTransactionReceipt(log.transactionHash);
    
          for(const log of (txRecipet?.logs ?? [])) {
            try {
              const res = iface.parseLog({data: log.data, topics: [...log.topics]});
              const postRoot = res?.args[2];
    
              // thrown if root is registered already
              const tx = await targetContract.getFunction('receiveRoot')(postRoot);
              const receipt = await tx.wait();
              console.log(`updated root from height=${txRecipet?.blockNumber}, root=${postRoot}, status=${receipt.status}`);
            } catch(e) {}
          }
        }
    
        if (latestBlockHeight >= blockHeight) {
          break;
        }
      }

      console.log('done, start sleep');

      await new Promise((resolve) => setTimeout(resolve, 1000*60*10));
    }
  });
