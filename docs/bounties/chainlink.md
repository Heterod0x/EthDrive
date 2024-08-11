## Chainlink CCIP Integration

We use Chainlink CCIP to enable cross-chain asset drag-and-drop between Sepolia, Optimism Sepolia, Base Sepolia, and Mode Testnet. The cross-chain bridge is a core feature of our account and chain abstraction UX.

## Actual Bridge Transaction

https://ccip.chain.link/tx/0xec5b153257a1d5b7061a4d31c34e5d79a5c3efd3510e145b2c8713be824d8dc3

## Implementation Refereces

- Smart contract

  - https://github.com/Heterod0x/EthDrive/blob/main/contracts/contracts/EthDriveCCIPTokenTransferor.sol

- Building account abstraction user operation with Chainlink CCIP bridge

  - https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useDragAndDrop.tsx#L95
