/**
 * Wallet Connection Utility
 * Handles MetaMask wallet connection and authentication
 */

import { ethers } from "ethers";
import contractAbi from "../constants/contractAbi.json";
import axios from "axios";
import { toast } from "react-hot-toast";
import logger from "./logger";

let isConnecting = false;

/**
 * Wraps a promise with a timeout to prevent indefinite waiting
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} timeoutMessage - Error message on timeout
 * @returns {Promise}
 */
const withTimeout = (promise, ms, timeoutMessage = "Request timed out") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]);

/**
 * Displays account selection modal when multiple accounts are available
 * @param {string[]} accounts - Array of account addresses
 * @returns {Promise<string>} Selected account address
 */
const showAccountSelectionModal = (accounts) => {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;

    const title = document.createElement("h2");
    title.textContent = "🦊 Choose Your Account";
    title.style.cssText = `
      color: white;
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
    `;

    // Create accounts container
    const accountsContainer = document.createElement("div");
    accountsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    `;

    // Add each account as a button
    accounts.forEach((account, index) => {
      const accountBtn = document.createElement("button");
      accountBtn.style.cssText = `
        background: white;
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      // Create avatar circle
      const avatar = document.createElement('div');
      avatar.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 18px;
      `;
      avatar.textContent = String(index + 1);

      // Create account info container
      const infoContainer = document.createElement('div');
      infoContainer.style.cssText = 'flex: 1;';

      // Create account label
      const accountLabel = document.createElement('div');
      accountLabel.style.cssText = 'font-weight: bold; color: #333; margin-bottom: 4px;';
      accountLabel.textContent = `Account ${index + 1}`;

      // Create account address (truncated)
      const accountAddress = document.createElement('div');
      accountAddress.style.cssText = 'font-family: monospace; color: #666; font-size: 14px;';
      accountAddress.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;

      // Assemble the button
      infoContainer.appendChild(accountLabel);
      infoContainer.appendChild(accountAddress);
      accountBtn.appendChild(avatar);
      accountBtn.appendChild(infoContainer);

      accountBtn.onmouseover = () => {
        accountBtn.style.transform = "scale(1.02)";
        accountBtn.style.borderColor = "#667eea";
        accountBtn.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
      };

      accountBtn.onmouseout = () => {
        accountBtn.style.transform = "scale(1)";
        accountBtn.style.borderColor = "transparent";
        accountBtn.style.boxShadow = "none";
      };

      accountBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve(account);
      };

      accountsContainer.appendChild(accountBtn);
    });

    // Create cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid white;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      margin-top: 16px;
      width: 100%;
      font-weight: bold;
      font-size: 16px;
      transition: all 0.3s;
    `;

    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = "rgba(255, 255, 255, 0.3)";
    };

    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = "rgba(255, 255, 255, 0.2)";
    };

    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(null);
    };

    // Assemble modal
    modal.appendChild(title);
    modal.appendChild(accountsContainer);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);

    // Add animation keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);
  });
};

/**
 * Connects to MetaMask wallet and authenticates user
 * @returns {Promise<{contractInstance: ethers.Contract, selectedAccount: string}>}
 */
export const connectWallet = async () => {
  if (isConnecting) {
    logger.debug("Connection already in progress");
    toast("⏳ Already connecting to MetaMask...");
    return { contractInstance: null, selectedAccount: null };
  }

  isConnecting = true;
  logger.debug("Starting MetaMask connection");

  try {
    // Verify MetaMask installation
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      logger.error("MetaMask not found");
      throw new Error("MetaMask not found. Please install MetaMask.");
    }
    logger.debug("MetaMask detected");

    // Check if MetaMask is unlocked
    let isUnlocked = true;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      isUnlocked = Array.isArray(accounts) && accounts.length > 0;
      logger.debug(`MetaMask unlock status: ${isUnlocked ? "UNLOCKED" : "LOCKED"}`);
    } catch (err) {
      logger.warn("Could not check MetaMask lock status:", err);
      
      // Fallback to experimental API
      try {
        if (window.ethereum._metamask && typeof window.ethereum._metamask.isUnlocked === "function") {
          isUnlocked = await window.ethereum._metamask.isUnlocked();
        }
      } catch (err2) {
        logger.warn("Fallback check failed:", err2);
        isUnlocked = true;
      }
    }

    if (!isUnlocked) {
      logger.debug("MetaMask is locked");
      throw new Error("MetaMask is locked");
    }

    logger.debug("MetaMask is unlocked - proceeding");

    // Request accounts from MetaMask
    logger.debug("Requesting accounts from MetaMask");
    toast.loading("Opening MetaMask...", { id: "metamask-connecting" });

    let accounts;
    try {
      accounts = await withTimeout(
        window.ethereum.request({ method: "eth_requestAccounts" }),
        15000,
        "Connecting to MetaMask timed out. Please check your MetaMask extension."
      );
      toast.dismiss("metamask-connecting");
      logger.debug(`Received ${accounts.length} account(s)`);
    } catch (error) {
      toast.dismiss("metamask-connecting");
      logger.error("Error requesting accounts:", error);
      if (error?.code === 4001) {
        throw new Error("User rejected connection request");
      } else if (error?.code === -32002) {
        throw new Error("Request already pending. Please check your MetaMask popups.");
      } else {
        throw error;
      }
    }

    if (!accounts || accounts.length === 0) {
      logger.error("No accounts found");
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    // Handle account selection for multiple accounts
    let selectedAccount;
    if (accounts.length > 1) {
      logger.debug("Multiple accounts detected, showing selection modal");
      toast("🔀 Multiple accounts found! Please choose one.", {
        icon: "👆",
        duration: 3000
      });
      selectedAccount = await showAccountSelectionModal(accounts);
      if (!selectedAccount) {
        logger.debug("User cancelled account selection");
        throw new Error("Account selection cancelled");
      }
    } else {
      selectedAccount = accounts[0];
    }

    logger.debug("Selected account:", selectedAccount);

    logger.debug("Creating provider and signer");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    logger.debug("Connected to network:", network.name, `(chainId: ${network.chainId})`);

    const signer = await provider.getSigner(selectedAccount);
    const signerAddress = await signer.getAddress();

    if (signerAddress.toLowerCase() !== selectedAccount.toLowerCase()) {
      throw new Error("Signer address mismatch");
    }
    logger.debug("Signer created for:", signerAddress);

    // Request signature for authentication
    logger.debug("Requesting signature");
    toast("📝 Please sign the message in MetaMask", { duration: 10000, icon: "🦊" });

    const message = "Welcome to CryptGuard! Please sign this message to authenticate your account";
    let signature;
    try {
      signature = await Promise.race([
        signer.signMessage(message),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Signature request timed out. Please check for MetaMask popup.")), 120000)
        ),
      ]);
      logger.debug("Signature received");
    } catch (err) {
      logger.error("Signature error:", err);
      if (err?.code === 4001 || err?.message?.toLowerCase().includes("cancel")) {
        throw new Error("You cancelled the signature request");
      } else {
        throw err;
      }
    }

    // Authenticate with backend
    logger.debug("Authenticating with backend");
    let res;
    try {
      res = await axios.post(
        `http://localhost:3000/api/authentication?address=${selectedAccount}`,
        { signature },
        { withCredentials: true }
      );
    } catch (err) {
      logger.error("Backend authentication failed:", err);
      throw new Error("Backend authentication failed");
    }

    if (!res?.data?.address) {
      logger.error("No address confirmed from backend");
      throw new Error("Authentication failed - no address confirmed");
    }

    // Save address to localStorage (JWT tokens stored in HttpOnly cookies automatically)
    localStorage.setItem("address", selectedAccount);
    logger.debug("Address saved to localStorage, tokens stored in secure HttpOnly cookies");

    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS in environment variables.");
    }
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    logger.success("Connection successful");
    return { contractInstance, selectedAccount };
  } catch (error) {
    logger.error("Connection failed:", error);
    throw error;
  } finally {
    isConnecting = false;
    logger.debug("Connection process ended");
  }
};
