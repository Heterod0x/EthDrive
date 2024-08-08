pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

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

    mapping(uint256 => bool) public nullifierHashes;

    mapping(address => bool) public verified;
    mapping(address => uint256) public deposited;

    error DuplicateNullifier(uint256 nullifierHash);

    event Verified(address indexed account, uint256 nullifierHash);

    constructor(
        // World ID contrract
        IWorldID _worldId,
        // World ID App ID
        string memory _appId,
        // World ID Action ID
        string memory _actionId
    ) {
        worldId = _worldId;
        externalNullifier = abi
            .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
            .hashToField();
    }

    function deposit(address account) public payable {
        deposited[account] += msg.value;
    }

    function withdrawFee(
        address account,
        uint256 fee
    ) public payable onlyOwner {
        deposited[account] -= fee;
    }

    function registerAddress(
        string calldata signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) public {
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

    function isPayable(address account) public view returns (bool) {
        return verified[account] && deposited[account] > 0;
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
