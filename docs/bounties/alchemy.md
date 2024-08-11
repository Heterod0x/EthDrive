## Why We Use Account Kit and Alchemy Embedded Account

We utilize Account Kit and Alchemy Embedded Account to make development more efficient.

## How It Was Used

We use Account Kit to facilitate account abstraction transactions with ERC6551 token-bound accounts in the app. Additionally, we use the Embedded Account for user sign-in.

We created a custom Alchemy account client, integrated it with a React hook SDK, and successfully implemented it within the app’s Token Bound Account. We believe this represents a creative use of the embedded account feature. For a standard embedded account, users can enable it in the Plugin, and if enabled, they can only use the Embedded Account.

Additionally, we integrated a custom cross-chain gas subsidy mechanism as an extension of the gas manager.

## Implementation References

Custom hook implementation
https://github.com/Heterod0x/EthDrive/blob/main/app/src/hooks/useSmartAccount.tsx

Building & Sending user operation
https://github.com/Heterod0x/EthDrive/blob/main/app/src/components/EthDrive.tsx#L378

Cross-chain gas subsidy mechanism with Gas Manager
https://github.com/Heterod0x/EthDrive/blob/main/app/src/app/actions/integrate-alchemy-and-eth-drive-chain.ts
