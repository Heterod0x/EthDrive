// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@account-abstraction/contracts/core/BasePaymaster.sol";

contract EthDrivePaymaster is BasePaymaster {
    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {}

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        context = new bytes(0);
        validationData = 0;
    }

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {}
}
