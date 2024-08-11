## Tenderly Integration

We initially used the Tenderly Virtual Testnet, which allowed us to interact with actual deployed contracts—a crucial feature since we are working with ERC4337 and ERC6551 contracts. These implementations require deep debugging, and Tenderly's Virtual Testnet has been invaluable in this regard. Additionally, when we activate Tenderly in Hardhat, it automatically verifies the contracts and enables Tenderly's debugging and simulation tools, making development significantly easier.

We have also made Tenderly Virtual Testnet accessible to our team and integrated it into our UI.

### Tx Exproler

Here, you can check the transactions made during the hackathon period as well as the associated contracts.

https://dashboard.tenderly.co/explorer/vnet/56839ed8-ce5c-4785-bfc7-573f11a9f5ed/transactions?kind=standard

### Code References

- Hardhat config

  - https://github.com/Heterod0x/EthDrive/blob/main/contracts/hardhat.config.ts#L30

- Frontend integration

  - https://github.com/Heterod0x/EthDrive/blob/main/app/src/lib/chain.ts#L17
