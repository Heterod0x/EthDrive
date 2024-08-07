export const config = {
  "9999999": {
    path: "tenderly-virtual-testnet",
    alchemyChainName: "",
    exproler:
      "https://dashboard.tenderly.co/explorer/vnet/56839ed8-ce5c-4785-bfc7-573f11a9f5ed",
    chainlinkCCIPChainSelecter: "",
    isAccountAbstractionEnabled: false,
    isCCIPEnabled: false,
  },
  "11155111": {
    path: "sepolia",
    alchemyChainName: "eth-sepolia",
    exproler: "https://eth-sepolia.blockscout.com",
    chainlinkCCIPChainSelecter: "",
    isAccountAbstractionEnabled: true,
    isCCIPEnabled: false,
  },
  "11155420": {
    path: "optimism-sepolia",
    alchemyChainName: "opt-sepolia",
    exproler: "https://optimism-sepolia.blockscout.com",
    chainlinkCCIPChainSelecter: "5224473277236331295",
    isAccountAbstractionEnabled: true,
    isCCIPEnabled: true,
  },
  "84532": {
    path: "base-sepolia",
    alchemyChainName: "base-sepolia",
    exproler: "https://base-sepolia.blockscout.com",
    chainlinkCCIPChainSelecter: "10344971235874465080",
    isAccountAbstractionEnabled: true,
    isCCIPEnabled: true,
  },
};
