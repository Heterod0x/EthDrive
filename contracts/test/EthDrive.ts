import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  getAddress,
  hashMessage,
  encodeFunctionData,
  zeroAddress,
  Hex,
  parseEther,
} from "viem";
import {
  entryPointAddress,
  erc6551RegistryAddress,
} from "../shared/external-contract";

describe("EthDrive", function () {
  async function deployEthDriveFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const entryPoint = await hre.viem.getContractAt(
      "IEntryPoint",
      entryPointAddress
    );
    const ethDrivePaymaster = await hre.viem.deployContract(
      "EthDrivePaymaster",
      [entryPointAddress]
    );
    const ethDriveAccountImplementation = await hre.viem.deployContract(
      "EthDriveAccount",
      [entryPointAddress]
    );
    const ethDrive = await hre.viem.deployContract("EthDrive", [
      erc6551RegistryAddress,
      ethDriveAccountImplementation.address,
    ]);
    const publicClient = await hre.viem.getPublicClient();
    return {
      entryPoint,
      ethDrivePaymaster,
      ethDriveAccountImplementation,
      ethDrive,
      publicClient,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { ethDrive, owner } = await loadFixture(deployEthDriveFixture);
      expect(await ethDrive.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe("Directory Creation", function () {
    it("Should create a directory and mint an NFT", async function () {
      const { ethDrive, owner } = await loadFixture(deployEthDriveFixture);
      const path = "folder1/folder2";
      await ethDrive.write.createDirectory([path]);
      const tokenId = await ethDrive.read.getTokenIdFromPath([path]);
      expect(await ethDrive.read.ownerOf([tokenId])).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should revert if the directory already exists", async function () {
      const { ethDrive } = await loadFixture(deployEthDriveFixture);
      const path = "folder1/folder2";
      await ethDrive.write.createDirectory([path]);
      await expect(ethDrive.write.createDirectory([path])).to.be.rejectedWith(
        "EthDrive: Directory already created"
      );
    });
  });

  describe("ERC-6551 Integration", function () {
    it("Should create a token-bound account and check isValidSigner", async function () {
      const { ethDrive, owner } = await loadFixture(deployEthDriveFixture);
      const path = "folder1/folder2";
      await ethDrive.write.createDirectory([path]);
      const tokenId = await ethDrive.read.getTokenIdFromPath([path]);
      const ethDriveAccountAddress =
        await ethDrive.read.getTokenBoundAccountFromTokenId([tokenId]);
      const ethDriveAccount = await hre.viem.getContractAt(
        "EthDriveAccount",
        ethDriveAccountAddress
      );
      const message = "Hello, world!";
      const messageHash = hashMessage(message);
      const signature = await owner.signMessage({ message });
      const magicValue = await ethDriveAccount.read.isValidSignature([
        messageHash,
        signature,
      ]);
      expect(magicValue).to.equal("0x1626ba7e");
    });
  });

  describe("ERC-4331 Integration", function () {
    it("Should execute a transaction", async function () {
      const {
        entryPoint,
        ethDrivePaymaster,
        ethDriveAccountImplementation,
        ethDrive,
        owner,
      } = await loadFixture(deployEthDriveFixture);

      const path = "folder1/folder2";
      await ethDrive.write.createDirectory([path]);
      const tokenId = await ethDrive.read.getTokenIdFromPath([path]);
      const ethDriveAccountAddress =
        await ethDrive.read.getTokenBoundAccountFromTokenId([tokenId]);
      const ethDriveAccount = await hre.viem.getContractAt(
        "EthDriveAccount",
        ethDriveAccountAddress
      );
      await ethDrivePaymaster.write.deposit({
        value: parseEther("0.001"),
      });
      const nonce = await ethDriveAccount.read.getNonce();
      const callData = encodeFunctionData({
        abi: ethDriveAccountImplementation.abi,
        functionName: "execute",
        args: [zeroAddress, BigInt(0), "0x"],
      });
      const userOperation = {
        sender: ethDriveAccount.address,
        nonce: nonce,
        initCode: "0x" as Hex,
        callData: callData,
        callGasLimit: 0n,
        verificationGasLimit: 100000n,
        preVerificationGas: 0n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        paymasterAndData: ethDrivePaymaster.address,
        signature: "0x" as Hex,
      };
      const userOpHash = await entryPoint.read.getUserOpHash([userOperation]);
      const signature = await owner.signMessage({
        message: { raw: userOpHash },
      });
      userOperation.signature = signature;
      await entryPoint.write.handleOps([
        [userOperation],
        owner.account.address,
      ]);
    });
  });
});
