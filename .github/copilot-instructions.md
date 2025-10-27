  # CryptGuard AI Coding Agent Instructions

## Project Overview
CryptGuard is a secure, decentralized vault for encrypted file storage using IPFS, blockchain (Ethereum), and the MERN stack. It provides end-to-end encryption, tamper detection, and blockchain-based authentication. The system is split into two main components:
- **Client**: React + Vite frontend for user interaction, wallet connection, and file management.
- **Server**: Node.js/Express backend for API, encryption, IPFS integration, and MongoDB persistence.

## Architecture & Data Flow
- **Upload Flow**: 
  1. Client encrypts file, sends to `/api/preUpload` (Server).
  2. Server encrypts, uploads to IPFS, returns CIDs.
  3. Client confirms upload on blockchain (via smart contract), then calls `/api/confirmUpload` to persist metadata in MongoDB.
- **Authentication**: JWT tokens issued after wallet authentication. All protected routes require `authenticateToken` middleware.
- **Blockchain**: Smart contract (`CryptGuard.sol`) stores file metadata (IPFS CID, hash, timestamp, uploader address). Prevents duplicate uploads by hash.
- **Database**: MongoDB stores file mappings and user encryption keys. See `models/FileMapping.js` and `models/User.js`.

## Developer Workflows
- **Client**:
  - Start: `npm run dev` in `Client/CryptGuard`
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Uses Vite, TailwindCSS, DaisyUI, ethers.js, axios
- **Server**:
  - Start: `npm start` in `Server`
  - Hot reload: via `nodemon`
  - Environment: set `MONGODB_URL`, `PORT`, `CORS_ORIGIN`, `PINATA_JWT` in `.env`
  - Key files: `controllers/preUploadFileController.js`, `controllers/confirmUploadController.js`, `middleware/authenticateToken.js`, `utils/encryption.js`

## Patterns & Conventions
- **API Client**: Centralized in `src/utils/apiClient.js` (Client). Always sends JWT in `Authorization` header.
- **File Upload**: Two-step process (`preUpload` then `confirmUpload`).
- **Smart Contract**: ABI in `src/constants/contractAbi.json`. Interact via ethers.js.
- **Error Handling**: Consistent JSON error responses. Duplicate uploads return 409 status.
- **Security**: Helmet, CORS, JWT, and encryption enforced throughout.
- **Testing**: No formal test suite; manual testing via client and API endpoints.

## Integration Points
- **IPFS**: Files uploaded via Pinata (see `PINATA_JWT`).
- **Blockchain**: Ethereum smart contract for file integrity and ownership.
- **MongoDB**: Stores user and file metadata.

## Examples
- To add a new API route, follow the pattern in `routes/uploadFileRoute.js` and protect with `authenticateToken`.
- To extend file metadata, update `models/FileMapping.js` and the smart contract.

---
For questions or unclear conventions, review `README.md` or ask for clarification. Update this file as new patterns emerge.
