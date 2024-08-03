// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/core/Helpers.sol";

import "./interfaces/IERC6551Account.sol";

contract EthDriveAccount is
    IERC165,
    IERC1271,
    IERC721Receiver,
    IERC1155Receiver,
    IERC6551Account,
    BaseAccount
{
    IEntryPoint private immutable _entryPoint;
    uint256 private _state;
    address private _cachedOwner;

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
    }

    receive() external payable {}

    modifier onlyEntryPointOrOwner() {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner(),
            "EthDriveAccount: not Owner or EntryPoint"
        );
        _;
    }

    modifier onlyTokenContract() {
        (, address tokenContract, ) = token();
        require(msg.sender == tokenContract, "EthDriveAccount: not token");
        _;
    }

    function cacheOwner(address cachedOwner) public onlyTokenContract {
        _cachedOwner = cachedOwner;
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) public onlyEntryPointOrOwner {
        _call(to, value, data);
    }

    function executeBatch(
        address[] calldata to,
        uint256[] calldata value,
        bytes[] calldata data
    ) public onlyEntryPointOrOwner {
        require(
            to.length == data.length && value.length == data.length,
            "wrong array lengths"
        );
        for (uint256 i = 0; i < data.length; i++) {
            _call(to[i], value[i], data[i]);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        _state++;
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function owner() public view virtual returns (address) {
        (uint256 chainId, address tokenContract, uint256 tokenId) = token();
        if (chainId != block.chainid) {
            return address(0);
        }
        return IERC721(tokenContract).ownerOf(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC1271).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) public view virtual returns (bytes4 magicValue) {
        bool isValid = SignatureChecker.isValidSignatureNow(
            owner(),
            hash,
            signature
        );
        if (isValid) {
            return IERC1271.isValidSignature.selector;
        }
        return bytes4(0);
    }

    function state() public view virtual returns (uint256) {
        return _state;
    }

    function token() public view virtual returns (uint256, address, uint256) {
        bytes memory footer = new bytes(0x60);
        assembly {
            extcodecopy(address(), add(footer, 0x20), 0x4d, 0x60)
        }
        return abi.decode(footer, (uint256, address, uint256));
    }

    function isValidSigner(
        address signer,
        bytes calldata
    ) public view virtual returns (bytes4) {
        if (signer == owner()) {
            return IERC6551Account.isValidSigner.selector;
        }
        return bytes4(0);
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = ECDSA.toEthSignedMessageHash(userOpHash);
        if (_cachedOwner != ECDSA.recover(hash, userOp.signature))
            return SIG_VALIDATION_FAILED;
        return 0;
    }
}
