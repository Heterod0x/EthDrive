pragma solidity ^0.8.24;

// Interface for OpWorldID
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

contract WorldIDVerifier {
    using ByteHasher for bytes;

    IWorldID internal immutable worldId;
    uint256 internal immutable externalNullifier;

    mapping (uint256 => bool) public nullifierHashes;

    event Verified(uint256 nullifierHash);

    error DuplicateNullifier(uint256 nullifierHash);

    constructor(
        IWorldID _worldId,
        string memory _appId,
        string memory _actionId
    ) {
        worldId = _worldId;
        externalNullifier = abi
            .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
            .hashToField();
    }

    function verifyAndExecute(
        string memory signal,
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

        nullifierHashes[nullifierHash] = true;
        emit Verified(nullifierHash);
    }
}
