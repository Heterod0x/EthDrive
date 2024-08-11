# Metal L2 Integration

We deployed our Google Drive-like wallet management system, utilizing ERC6551 token-bound accounts and ERC4337 account abstraction, to the Metal L2 Testnet.

We also integrated Alchemy Embedded Account, which supports passkey sign-in. Unfortunately, Alchemy does not yet support Metal L2, but once they do, we will be able to bring passkey functionality to Metal L2 as well.

Additionally, we believe we have built a complex and innovative smart contract that will transform the wallet interaction UI/UX on Metal L2.

## Deployed Contracts

- EthDrive

  - https://testnet.explorer.metall2.com/address/0x73E5D195B5cf7EB46DE86901AD941986E74921CA

## Implementation References

### Passkey Integration

https://github.com/Heterod0x/EthDrive/blob/main/app/src/components/Header.tsx#L127

### Metal L2 UI Integration

- https://github.com/Heterod0x/EthDrive/blob/main/app/src/lib/chain.ts#L34

- https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useDirectory.tsx#L82
