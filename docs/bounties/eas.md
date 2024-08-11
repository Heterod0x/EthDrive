# EAS Integration

We implemented tag management with EAS, allowing users to manage multiple wallets more effectively. We created an EAS schema on Ethereum Sepolia, enabling users to create attestations with the token-bound account as the recipient. The tag information is then displayed in the UI. This feature addresses the challenge of managing a large number of wallets, where directory names alone can become difficult to navigate. By adding tags, users can better organize their wallets. While we plan to implement search functionality in the future, our ultimate goal is to create a system where on-chain data can reference tagged wallets, making it easier to manage and access wallet information.

## Implementation References

- Data fetch

  - https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useTags.tsx

- Tag display and creation

  - https://github.com/Heterod0x/EthDrive/blob/main/app/src/components/EthDrive.tsx#L695

## Created Schema

https://sepolia.easscan.org/schema/view/0x00e3e054d5f8f8f81c25009189773997ba5b4e082eba3edef2d93134dda7e81a
