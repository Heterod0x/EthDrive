import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

describe("EthDrive", function () {
  async function deployEthDriveFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const ethDrive = await hre.viem.deployContract("EthDrive", [
      owner.account.address,
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
      const tokenId = await ethDrive.write.createDirectory([directoryStrings]);

      // Ensure the directory is registered
      const path = directoryStrings.join("/");

      // Fetch the token ID using the getTokenIdFromPath function
      const fetchedTokenId = await ethDrive.read.getTokenIdFromPath([path]);

      // Ensure the NFT was minted with the correct tokenId
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
});
