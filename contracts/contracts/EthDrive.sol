// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IERC6551Registry.sol";

contract EthDrive is ERC721, Ownable {
    event CreateRegistry(string path);

    mapping(string => bool) public isCreated;
    address public erc6551Registry;
    address public accountImplementaton;

    constructor(
        address initialOwner,
        address erc6551Registry_,
        address accountImplementaton_
    ) ERC721("EthDrive", "EDRV") Ownable(initialOwner) {
        erc6551Registry = erc6551Registry_;
        accountImplementaton = accountImplementaton_;
    }

    function createDirectory(string[] memory directoryStrings) public {
        require(
            isValidDirectoryStrings(directoryStrings),
            "EthDrive: Invalid directory strings"
        );

        string memory path = encodeDirectoryPath(directoryStrings);
        uint256 tokenId = getTokenIdFromPath(path);

        require(!isCreated[path], "EthDrive: Directory already created");
        isCreated[path] = true;

        _mint(msg.sender, tokenId);
        IERC6551Registry(erc6551Registry).createAccount(
            accountImplementaton,
            "",
            block.chainid,
            address(this),
            tokenId
        );

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

    function isValidDirectoryStrings(
        string[] memory directoryStrings
    ) public pure returns (bool) {
        for (uint256 i = 0; i < directoryStrings.length; i++) {
            bytes memory dir = bytes(directoryStrings[i]);
            for (uint256 j = 0; j < dir.length; j++) {
                if (dir[j] == "/") {
                    return false;
                }
            }
        }
        return true;
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
}
