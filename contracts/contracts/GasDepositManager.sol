// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@pythnetwork/pyth-sdk-solidity/PythUtils.sol";

interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

library ByteHasher {
    function hashToField(bytes memory value) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(value))) >> 8;
    }
}

contract GasDepositManager is Ownable {
    using ByteHasher for bytes;

    IWorldID internal immutable worldId;
    uint256 internal immutable externalNullifier;

    IPyth pyth;
    bytes32 ethUsdPriceId;
    uint256 lastEthUsdRate;

    mapping(uint256 => bool) public nullifierHashes;

    mapping(address => bool) public verified;
    mapping(address => uint256) public deposited;

    error DuplicateNullifier(uint256 nullifierHash);

    event Verified(address indexed account, uint256 nullifierHash);
    event Deposited(address indexed account, uint256 amount, uint256 total);
    event EthUsdRateUpdated(uint256 rate);
    event Feewithdrawn(address indexed account, uint256 amount);

    constructor(
        // World ID contrract
        IWorldID _worldId,
        // World ID App ID
        string memory _appId,
        // World ID Action ID
        string memory _actionId,
        // Pyth Oracle
        IPyth _pyth,
        // ETH/USD price ID
        bytes32 _ethUsdPriceId
    ) {
        worldId = _worldId;
        externalNullifier = abi
            .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
            .hashToField();

        pyth = _pyth;
        ethUsdPriceId = _ethUsdPriceId;
    }

    function isPayable(address account) public view returns (bool) {
        return verified[account] && deposited[account] > 0;
    }

    function deposit(address account) public payable {
        _deposit(account, msg.value);
    }

    function withdrawFee(address account, uint256 fee) public onlyOwner {
        _withdrawFee(account, fee);
    }

    function withdrawFeeInUsd(
        address account,
        uint256 usdFee, // (Dollar Amount) * 10**18
        bytes[] calldata pythUpdateData
    ) public onlyOwner {
        _withdrawFeeInUsd(account, usdFee, pythUpdateData);
    }

    function registerAddress(
        string calldata signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) public {
        _registerAddress(signal, root, nullifierHash, proof);
    }

    function _registerAddress(
        string calldata signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) internal {
        if (nullifierHashes[nullifierHash])
            revert DuplicateNullifier(nullifierHash);

        worldId.verifyProof(
            root,
            abi.encodePacked(signal).hashToField(),
            nullifierHash,
            externalNullifier,
            proof
        );

        address target = toAddress(signal);

        verified[target] = true;
        nullifierHashes[nullifierHash] = true;

        emit Verified(target, nullifierHash);
    }

    function _deposit(address account, uint256 amount) internal {
        deposited[account] += amount;

        emit Deposited(account, amount, deposited[account]);
    }

    function _withdrawFee(address account, uint256 fee) internal {
        deposited[account] -= fee;
        
        emit Feewithdrawn(account, fee);
    }

    function _withdrawFeeInUsd(
        address account,
        uint256 usdFee,
        bytes[] calldata pythUpdateData
    ) internal {
        uint256 updateFee = _updateEthUsdPrice(pythUpdateData);

        uint256 ethFee = _convertUsdToEth(usdFee);

        _withdrawFee(account, ethFee + updateFee);
    }

    function _updateEthUsdPrice(bytes[] calldata pythUpdateData) internal returns (uint256) {
        uint256 updateFee = pyth.getUpdateFee(pythUpdateData);
        pyth.updatePriceFeeds{value: updateFee}(pythUpdateData);

        return updateFee;
    }

    function _convertUsdToEth(uint256 usdAmount) internal returns (uint256) {
        PythStructs.Price memory currentPrice = pyth.getPriceNoOlderThan(
            ethUsdPriceId,
            60
        );

        uint256 uintPrice = PythUtils.convertToUint(
            currentPrice.price,
            currentPrice.expo,
            18
        );
        uint256 powUsdAmount = usdAmount * 10 ** 18;
        uint256 ethAmount = powUsdAmount / uintPrice;
        if (powUsdAmount % uintPrice > 0) {
            ethAmount += 1;
        }

        if (uintPrice != lastEthUsdRate) {
            lastEthUsdRate = uintPrice;
            emit EthUsdRateUpdated(uintPrice);
        }

        return ethAmount;
    }

    // helper functions
    // converts string hex address to address
    function toAddress(string calldata s) public pure returns (address) {
        bytes memory parsedBytes = hexStringToAddress(s);
        require(parsedBytes.length == 20, "invalid address length");

        address tempAddress;
        assembly {
            tempAddress := mload(add(parsedBytes, 20))
        }

        return tempAddress;
    }

    function hexStringToAddress(
        string calldata s
    ) public pure returns (bytes memory) {
        bytes memory bs = bytes(s);
        require(bs.length % 2 == 0, "byte length must be even");

        bytes memory res = new bytes(bs.length / 2);
        for (uint i = 0; i < bs.length / 2; ++i) {
            res[i] = bytes1(
                16 *
                    fromHexChar(uint8(bs[2 * i])) +
                    fromHexChar(uint8(bs[2 * i + 1]))
            );
        }

        return res;
    }

    function fromHexChar(uint8 c) public pure returns (uint8) {
        if (bytes1(c) >= bytes1("0") && bytes1(c) <= bytes1("9")) {
            return c - uint8(bytes1("0"));
        }
        if (bytes1(c) >= bytes1("a") && bytes1(c) <= bytes1("f")) {
            return 10 + c - uint8(bytes1("a"));
        }
        if (bytes1(c) >= bytes1("A") && bytes1(c) <= bytes1("F")) {
            return 10 + c - uint8(bytes1("A"));
        }

        return 0;
    }
}
