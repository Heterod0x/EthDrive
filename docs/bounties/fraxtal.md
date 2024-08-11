# Fraxtal Integration

We deployed our Google Drive-like wallet management system, utilizing ERC6551 token-bound accounts and ERC4337 account abstraction, to the Fraxtal mainnet. As part of this implementation, we issued NFTs that represent directories on the Fraxtal mainnet.

Unlike other chains where we deployed on testnets, this implementation is on the Fraxtal mainnet.

We also integrated directory-based wallet management with WalletConnect, which we believe introduces a new way of interacting with dApps on the Fraxtal mainnet.

## Deployed Contracts

- EthDrive

  - https://fraxscan.com/address/0x73E5D195B5cf7EB46DE86901AD941986E74921CA

## Implementation References

- Wallet Connect for dApps integration

  - https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useWalletConnect.tsx

### Fraxtal UI Integration

- https://github.com/Heterod0x/EthDrive/blob/main/app/src/app/providers.tsx#L38

- https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useDirectory.tsx#L89
