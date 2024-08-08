import hre from "hardhat";

const GAS_DEPOSIT_MANAGER_ADDRESS =
  "0xCaEb2Fc241cF6cab65670fb8fc52334eFD547BDd";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const address = await signer.getAddress();

  const depositManager = await hre.ethers.getContractAt(
    "GasDepositManager",
    GAS_DEPOSIT_MANAGER_ADDRESS
  );

  const tx = await depositManager.withdrawFee(
    address,
    hre.ethers.parseUnits('0.001'),
  );

  console.log(`tx sent, hash => ${tx.hash}`);

  const receipt = await tx.wait();

  console.log('receipt', receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
