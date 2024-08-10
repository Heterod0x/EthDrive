export const config = {
  "9999999": {
    path: "tenderly-virtual-testnet",
    alchemyChainName: "",
    alchemyGasManagerPolicyId: "",
    alchemyGasManagerPolicyIdWithWithdraw: "",
    exproler:
      "https://dashboard.tenderly.co/explorer/vnet/56839ed8-ce5c-4785-bfc7-573f11a9f5ed",
    chainlinkCCIPChainSelecter: "",
    isAccountAbstractionEnabled: false,
    isCCIPEnabled: false,
  },
  "11155111": {
    path: "sepolia",
    alchemyChainName: "eth-sepolia",
    alchemyGasManagerPolicyId: "12b15339-a879-40fb-8f17-a4ff9bcf62fd",
    alchemyGasManagerPolicyIdWithWithdraw:
      "eae153d1-971f-41bb-8858-29595dfef565",
    exproler: "https://eth-sepolia.blockscout.com",
    chainlinkCCIPChainSelecter: "",
    isAccountAbstractionEnabled: true,
    isCCIPEnabled: false,
  },
  "11155420": {
    path: "optimism-sepolia",
    alchemyChainName: "opt-sepolia",
    alchemyGasManagerPolicyId: "17c0aab3-b859-4b6b-bcce-0fd59b205840",
    alchemyGasManagerPolicyIdWithWithdraw:
      "e7a3d90b-d254-40f7-81bf-b576e37f3b00",
    exproler: "https://optimism-sepolia.blockscout.com",
    chainlinkCCIPChainSelecter: "5224473277236331295",
    isAccountAbstractionEnabled: true,
    isCCIPEnabled: true,
  },
  "84532": {
    path: "base-sepolia",
    alchemyChainName: "base-sepolia",
    alchemyGasManagerPolicyId: "d915053b-8a63-4f6a-af7b-50d1a2144435",
    alchemyGasManagerPolicyIdWithWithdraw:
      "984e218d-1ed1-4201-b86d-54089960159a",
    exproler: "https://base-sepolia.blockscout.com",
    chainlinkCCIPChainSelecter: "10344971235874465080",
    isAccountAbstractionEnabled: true,
    isCCIPEnabled: true,
  },
};
