# EthDrive

Here’s a wallet like you’ve never seen before—Google Drive for your assets. Organize and manage your assets with a directory structure, trade them, and even connect your directories to dApps.

![top](./docs/top.png)

## Demo App

https://super-eth-drive.vercel.app/

## Description

EthDrive is a service that allows you to organize and manage the assets in your wallet like Google Drive. By combining ERC6551 and Account Abstraction, it enables asset organization, transfers, bridging, swapping, and even connections to various dApps with a user-friendly interface similar to cloud storage services.

Directories are created as NFTs, and assets can be stored within them. This allows users to view all directories transparently and centrally, much like directory functions within a single computer. We call this the Universal Directory. Just like ENS, all directories become part of the Universal Directory, making it accessible for everyone to use.

To enhance the UX of EthDrive, we have created a dedicated L2 chain for gas fee subsidies. Users with a World ID can receive gas fee subsidies, making EthDrive even more convenient to use.

## How it's made

![architecture](./docs/architecture.png)

We used the following core elements to manage multiple accounts across different chains:

- ERC6551 Token Bound Account
- ERC4337 Account Abstraction
- Cross-chain Bridge and Cross-chain Gas Subsidiary

By combining these elements, we created an Account & Chain Abstraction UX that allows users to manage assets across multiple accounts and chains with a simple drag-and-drop between directories.

In our system, each directory is an NFT with a corresponding Token Bound Account, allowing users to manage the directory as an account through account abstraction. We've deployed smart contracts on Ethereum Sepolia, Optimism Sepolia, Base Sepolia, Mode Testnet, Celo Alfajores, Metal L2 Testnet, Fraxtal Mainnet, and Tenderly Virtual Testnet. We use Chainlink CCIP as a cross-chain bridge to enable seamless cross-chain asset transfers. Smart contract data is then aggregated using a Goldsky subgraph, and Blockscount is used as a multichain explorer for all chains. To enhance wallet management, we implemented tag management with EAS, allowing users to manage multiple wallets more effectively. Additionally, we've integrated Farcaster Frame to improve the onboarding experience.

We used Alchemy Account Kit for account abstraction and set up an extension for Alchemy Gas Manager. This setup verifies users with World ID for Sybil detection and allows them to deposit gas on a custom OPStack chain. The deposited gas is then used across all connected chains during transactions. Additionally, the custom chain integrates Pyth as a price oracle, enabling the acceptance of more chains within the system.

## Deployed Contracts for ETHDrive Application

```
// prettier-ignore
export const addresses = {
  "252": {
    "ethDrive": "0x73E5D195B5cf7EB46DE86901AD941986E74921CA",
    "ethDrivePaymaster": "0x15e4294eA33f19828eCA2B6B2B867aBf0C2509f8",
    "ethDriveCCIPTokenTransferor": ""
  },
  "919": {
    "ethDrive": "0x73E5D195B5cf7EB46DE86901AD941986E74921CA",
    "ethDrivePaymaster": "0x15e4294eA33f19828eCA2B6B2B867aBf0C2509f8",
    "ethDriveCCIPTokenTransferor": "0xf927004F33f26CaA1763BB21454Ef36AA76e1064"
  },
  "1740": {
    "ethDrive": "0x73E5D195B5cf7EB46DE86901AD941986E74921CA",
    "ethDrivePaymaster": "0x15e4294eA33f19828eCA2B6B2B867aBf0C2509f8",
    "ethDriveCCIPTokenTransferor": ""
  },
  "44787": {
    "ethDrive": "0x73E5D195B5cf7EB46DE86901AD941986E74921CA",
    "ethDrivePaymaster": "0x15e4294eA33f19828eCA2B6B2B867aBf0C2509f8",
    "ethDriveCCIPTokenTransferor": "0xf927004F33f26CaA1763BB21454Ef36AA76e1064"
  },
  "84532": {
    "ethDrive": "0x8FBb3479FD8C40667e01e37bd26f83c0587E2443",
    "ethDrivePaymaster": "0x1B00C6a2216538D4d9af21559F990FC7DE496009",
    "ethDriveCCIPTokenTransferor": "0x3Ba66873bbe9EaF37191c495d8cE3545Eed9541E"
  },
  "9999999": {
    "ethDrive": "0x8539d462b870E7490313149e68Ea3ED812377Ccb",
    "ethDrivePaymaster": "0x2215a0cd16E278c0aC718128F471F7729d1e1e46",
    "ethDriveCCIPTokenTransferor": ""
  },
  "11155111": {
    "ethDrive": "0xa4b20ad8AbC5Af7a08F3d2FF206296a0c3AFBeA7",
    "ethDrivePaymaster": "0xB55B1d785D9a0D9A9B8f25900fae4D1E1e552f46",
    "ethDriveCCIPTokenTransferor": "0x00e523DCD527A34Ca9Ba574d392C21e2Ca71d565"
  },
  "11155420": {
    "ethDrive": "0x60f771eFf86fED320Ba2975e85fcc2093aC290AC",
    "ethDrivePaymaster": "0x0D261CebfDE651F6A7aE8040dF80aB3be0EB47fe",
    "ethDriveCCIPTokenTransferor": "0x79945cfcd1358311bE3c8E281CfE70AA162aB8A3"
  }
} as const;

```

## Deployed Contracts for ETHDrive Cross-chain Gas Subsidiary Chain

### GasDepositManager

- https://explorer-superhack-test-v4369l32sl.t.conduit.xyz/address/0x51c920fd32a964FAC71AB9627FEBe7176422654a

### OPWorldID

- https://explorer-superhack-test-v4369l32sl.t.conduit.xyz/address/0xbA9ff1dA3e326b1B625b8a460e0818405982a907

### WormholeReceiver

#### Proxy

- https://explorer-superhack-test-v4369l32sl.t.conduit.xyz/address/0xf57d199Baf2cA58BeF391c78d3d06f6eD645A095

#### Implementation

- https://explorer-superhack-test-v4369l32sl.t.conduit.xyz/address/0x07A1bB0F39C8EA69af7A9F2623fd0E1571c663F1

### PythUpgradable

#### Proxy

- https://explorer-superhack-test-v4369l32sl.t.conduit.xyz/address/0xF730AB5BB78e735Bc1746C778b44D85EBE0519A5

#### Implementation

- https://explorer-superhack-test-v4369l32sl.t.conduit.xyz/address/0x98a4A62900b88b3E9c3b6ebc717D8b38100fdF9E
