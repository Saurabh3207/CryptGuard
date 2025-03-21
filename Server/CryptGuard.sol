// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptGuard {
    // Mapping to store the owner of each uploaded file
    address public owner;

    struct FileMetadata {
        string ipfsCID;      // IPFS CID (Stored on-chain)
        bytes32 fileHash;    // SHA-256 Hash for Integrity
        uint256 uploadTimestamp; // Timestamp for Record-Keeping
        address uploader;   // Address of the uploader
    }

    // Store files by each user's address
    mapping(address => FileMetadata[]) private userFiles;

    mapping(bytes32 => bool) private uploadedHashes; // Prevents duplicate uploads

    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Contracts are not allowed");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Uploads a file's metadata (IPFS CID & Hash).
     * @dev Allows only the uploader (MetaMask address) to upload their file.
     * @param _ipfsCID IPFS Content Identifier (CID).
     * @param _fileHash SHA-256 hash of the file.
     */

    function uploadFile(string calldata _ipfsCID, bytes32 _fileHash) external onlyEOA {
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(_fileHash != bytes32(0), "Invalid file hash");
        require(!uploadedHashes[_fileHash], "File already exists");

        userFiles[msg.sender].push(FileMetadata(_ipfsCID, _fileHash, block.timestamp, msg.sender));
        uploadedHashes[_fileHash] = true;
    }

    /**
     * @notice Retrieves all files uploaded by the caller (only their files).
     * @return An array of FileMetadata structures.
     */
     
    function viewFiles() external view onlyEOA returns (FileMetadata[] memory) {
        return userFiles[msg.sender];
    }

    /**
     * @notice Verifies file integrity by comparing stored and provided hash.
     * @param _index Index of the file in the uploaded files.
     * @param _currentHash The hash to be verified against stored data.
     * @return `true` if hashes match, `false` otherwise.
     */

    function verifyFile(uint256 _index, bytes32 _currentHash) external view onlyEOA returns (bool) {
        require(_index < userFiles[msg.sender].length, "Invalid File Index");
        return userFiles[msg.sender][_index].fileHash == _currentHash;
    }
}
