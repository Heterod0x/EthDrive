## Forking OPStack

We set up a forked OPStack chain specifically for a cross-chain gas subsidy system using Conduit. We added a bridge smart contract module for World ID verification and Pyth price oracle integration. By connecting smart contract data and backend systems with Alchemy's gas management API, users can deposit gas on one chain and pay gas fees across multiple chains seamlessly.

## Superchain Maxi

Additionally, we deployed our Google Drive-like wallet management system, utilizing ERC6551 token-bound accounts and ERC4337 account abstraction, to several networks: Optimism Sepolia, Base Sepolia, Mode Testnet, Celo Alfajores, Metal L2 Testnet, and Fraxtal Mainnet. We use Chainlink CCIP as a cross-chain bridge to enable seamless cross-chain asset transfers.

## Implementation Reference

- How we build forked OPStack chain

  - https://github.com/Heterod0x/EthDrive/issues/50

- Multichain deployed contracts

  - https://github.com/Heterod0x/EthDrive/blob/main/contracts/shared/app/addresses.ts

- Multichain data fetch

  - https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useDirectory.tsx
