import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, hashMessage } from "viem";
import { erc6551RegistryAddress } from "../config";

describe("EthDrive", function () {
  async function deployEthDriveFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const erc6551AccountImplementation = await hre.viem.deployContract(
      "ERC6551Account"
    );

    const ethDrive = await hre.viem.deployContract("EthDrive", [
      owner.account.address,
      erc6551RegistryAddress,
      erc6551AccountImplementation.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      ethDrive,
      owner,
      otherAccount,
      publicClient,
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

      const directoryStrings = ["folder1", "folder2"];
      await ethDrive.write.createDirectory([directoryStrings]);

      const path = await ethDrive.read.encodeDirectoryPath([directoryStrings]);
      const fetchedTokenId = await ethDrive.read.getTokenIdFromPath([path]);

      expect(await ethDrive.read.ownerOf([fetchedTokenId])).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should revert if the directory already exists", async function () {
      const { ethDrive } = await loadFixture(deployEthDriveFixture);

      const directoryStrings = ["folder1", "folder2"];
      await ethDrive.write.createDirectory([directoryStrings]);

      await expect(
        ethDrive.write.createDirectory([directoryStrings])
      ).to.be.rejectedWith("EthDrive: Directory already created");
    });

    it("Should revert if a directory contains '/' character", async function () {
      const { ethDrive } = await loadFixture(deployEthDriveFixture);

      const invalidDirectoryStrings = ["folder1", "inva/lid"];

      await expect(
        ethDrive.write.createDirectory([invalidDirectoryStrings])
      ).to.be.rejectedWith("EthDrive: Invalid directory strings");
    });
  });

  describe("ERC-6551 Integration", function () {
    it("Should create a token-bound account and check isValidSigner", async function () {
      const { ethDrive, owner } = await loadFixture(deployEthDriveFixture);

      const directoryStrings = ["folder1", "folder2"];
      await ethDrive.write.createDirectory([directoryStrings]);
      const path = await ethDrive.read.encodeDirectoryPath([directoryStrings]);
      const tokenId = await ethDrive.read.getTokenIdFromPath([path]);

      const account = await ethDrive.read.getAccount([tokenId]);

      const erc6551Account = await hre.viem.getContractAt(
        "ERC6551Account",
        account
      );

      const message = "Hello, world!";
      const messageHash = hashMessage(message);
      const signature = await owner.signMessage({ message });

      const magicValue = await erc6551Account.read.isValidSignature([
        messageHash,
        signature,
      ]);

      expect(magicValue).to.equal("0x1626ba7e");
    });
  });
});
