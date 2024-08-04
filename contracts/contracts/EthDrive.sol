// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IERC6551Registry.sol";
import "./EthDriveAccount.sol";

contract EthDrive is ERC721, Ownable {
    struct Directory {
        string path;
        uint256 tokenId;
        address tokenBoundAccount;
        address holder;
    }

    event CreateRegistry(string path);

    mapping(string => bool) public isCreated;
    address public erc6551Registry;
    address public accountImplementaton;

    Directory[] private _createdDirectories;

    constructor(
        address erc6551Registry_,
        address accountImplementaton_
    ) ERC721("EthDrive", "EDRV") {
        erc6551Registry = erc6551Registry_;
        accountImplementaton = accountImplementaton_;
    }

    function createDirectory(string memory path) public {
        uint256 tokenId = getTokenIdFromPath(path);

        require(!isCreated[path], "EthDrive: Directory already created");
        isCreated[path] = true;

        IERC6551Registry(erc6551Registry).createAccount(
            accountImplementaton,
            "",
            block.chainid,
            address(this),
            tokenId
        );
        _mint(msg.sender, tokenId);
        Directory memory directory = Directory({
            path: path,
            tokenId: tokenId,
            tokenBoundAccount: getTokenBoundAccountFromTokenId(tokenId),
            holder: msg.sender
        });
        _createdDirectories.push(directory);
        emit CreateRegistry(path);
    }

    function encodeDirectoryPath(
        string[] memory directoryStrings
    ) public pure returns (string memory) {
        string memory path = "";

        for (uint256 i = 0; i < directoryStrings.length; i++) {
            path = string(abi.encodePacked(path, directoryStrings[i]));
            if (i < directoryStrings.length - 1) {
                path = string(abi.encodePacked(path, "/"));
            }
        }

        return path;
    }

    function getTokenIdFromPath(
        string memory path
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(path)));
    }

    function getTokenBoundAccountFromTokenId(
        uint256 tokenId
    ) public view returns (address) {
        return
            IERC6551Registry(erc6551Registry).account(
                accountImplementaton,
                "",
                block.chainid,
                address(this),
                tokenId
            );
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        if (to != address(0)) {
            address account = IERC6551Registry(erc6551Registry).account(
                accountImplementaton,
                "",
                block.chainid,
                address(this),
                tokenId
            );
            EthDriveAccount(payable(address(uint160(account)))).cacheOwner(to);
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function getCreatedDirectories() public view returns (Directory[] memory) {
        return _createdDirectories;
    }
}
