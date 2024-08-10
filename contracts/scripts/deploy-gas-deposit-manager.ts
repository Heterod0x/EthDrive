import hre from "hardhat";

async function main() {
  const PythUtils = await hre.ethers.getContractFactory("PythUtils");
  const pythUtils = await PythUtils.deploy();
  pythUtils.waitForDeployment();

  const factory = await hre.ethers.getContractFactory("GasDepositManager", {
    libraries: {
      PythUtils: await pythUtils.getAddress(),
    },
  });
  const gasDepositManager = await factory.deploy(
    // OPWorldID Bridge contract
    '0xba9ff1da3e326b1b625b8a460e0818405982a907',
    // World ID App ID
    'app_0c9ba331cf226fe31b385058d04d8141',
    // World ID Action
    'super-hack-main-action-1',
    // Pyth Address
    "0xF730AB5BB78e735Bc1746C778b44D85EBE0519A5",
    // Pyth ETH/USD Price ID
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
  );

  await gasDepositManager.waitForDeployment();

  console.log(`GasDepositManager has been deployed => ${await gasDepositManager.getAddress()}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
