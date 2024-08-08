import hre from "hardhat";

async function main() {
  const factory = await hre.ethers.getContractFactory("GasDepositManager");
  const prover = await factory.deploy(
    // OPWorldID Bridge contract
    '0xba9ff1da3e326b1b625b8a460e0818405982a907',
    // World ID App ID
    'app_0c9ba331cf226fe31b385058d04d8141',
    // World ID Action
    'super-hack-main-action-1'
  );

  await prover.waitForDeployment();

  console.log(`GasDepositManager has been deployed => ${await prover.getAddress()}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
