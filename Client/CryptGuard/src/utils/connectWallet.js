// utils/connectWallet.js
import { ethers } from "ethers";
import contractAbi from "../constants/contractAbi.json";
import axios from "axios";
import { toast } from "react-hot-toast";

let isConnecting = false; // Prevents multiple MetaMask requests

// Utility: wrap a promise with a timeout to avoid indefinite hang
const withTimeout = (promise, ms, timeoutMessage = "Request timed out") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]);

// Function to show account selection modal (unchanged)
const showAccountSelectionModal = (accounts) => {
  return new Promise((resolve) => {
    // Create modal overlay
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

    // Create modal container
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

    // Create title
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

      accountBtn.innerHTML = `
        <div style="
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
        ">
          ${index + 1}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: #333; margin-bottom: 4px;">
            Account ${index + 1}
          </div>
          <div style="font-family: monospace; color: #666; font-size: 14px;">
            ${account.slice(0, 6)}...${account.slice(-4)}
          </div>
        </div>
      `;

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

    // Add to DOM
    document.body.appendChild(overlay);
  });
};

export const connectWallet = async () => {
  if (isConnecting) {
    console.log("⏳ Connection already in progress");
    toast("⏳ Already connecting to MetaMask...");
    return { contractInstance: null, selectedAccount: null };
  }

  isConnecting = true;
  console.log("🚀 ========== STARTING METAMASK CONNECTION ==========");

  try {
    // Step 1: Check if MetaMask is installed
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      console.error("❌ MetaMask not found");
      // Throw so caller handles UI
      throw new Error("MetaMask not found. Please install MetaMask.");
    }
    console.log("✅ MetaMask detected");

    // Step 2: Check if unlocked using STANDARD method first (avoids experimental API warning)
    let isUnlocked = true;
    try {
      // Use standard eth_accounts first (no warnings)
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      isUnlocked = Array.isArray(accounts) && accounts.length > 0;
      console.log(`🔍 MetaMask unlock status (via eth_accounts): ${isUnlocked ? "UNLOCKED ✅" : "LOCKED 🔒"}`);
    } catch (err) {
      console.warn("⚠️ Could not check MetaMask lock status via eth_accounts:", err);
      
      // Fallback: try experimental API only if standard method fails
      try {
        if (window.ethereum._metamask && typeof window.ethereum._metamask.isUnlocked === "function") {
          isUnlocked = await window.ethereum._metamask.isUnlocked();
          console.log(`🔍 MetaMask unlock status (via _metamask): ${isUnlocked ? "UNLOCKED ✅" : "LOCKED 🔒"}`);
        }
      } catch (err2) {
        console.warn("⚠️ Fallback check also failed:", err2);
        isUnlocked = true; // assume unlocked and let eth_requestAccounts handle it
      }
    }

    if (!isUnlocked) {
      console.log("🔒 MetaMask is locked - aborting connection");
      // Throw and let caller show toast (so UI updates are coordinated)
      throw new Error("MetaMask is locked");
    }

    console.log("✅ MetaMask is unlocked - proceeding with connection");

    // Step 3: Request accounts from MetaMask with a timeout
    console.log("📋 Requesting accounts from MetaMask (with timeout)...");
    toast.loading("Opening MetaMask...", { id: "metamask-connecting" });

    let accounts;
    try {
      // Short timeout so app doesn't hang if MetaMask silently refuses to open a popup
      accounts = await withTimeout(
        window.ethereum.request({ method: "eth_requestAccounts" }),
        15000,
        "Connecting to MetaMask timed out. Please check your MetaMask extension."
      );
      toast.dismiss("metamask-connecting");
      console.log(`✅ Received ${accounts.length} account(s):`, accounts);
    } catch (error) {
      toast.dismiss("metamask-connecting");
      console.error("❌ Error requesting accounts:", error);
      if (error?.code === 4001) {
        // User explicitly rejected
        throw new Error("User rejected connection request");
      } else if (error?.code === -32002) {
        throw new Error("Request already pending. Please check your MetaMask popups.");
      } else {
        // Propagate generic message
        throw error;
      }
    }

    if (!accounts || accounts.length === 0) {
      console.error("❌ No accounts found");
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    // Step 4: Account selection (if multiple)
    let selectedAccount;
    if (accounts.length > 1) {
      console.log("🔀 Multiple accounts detected, showing selection modal...");
      toast("🔀 Multiple accounts found! Please choose one.", {
        icon: "👆",
        duration: 3000
      });
      selectedAccount = await showAccountSelectionModal(accounts);
      if (!selectedAccount) {
        console.log("❌ User cancelled account selection");
        throw new Error("Account selection cancelled");
      }
    } else {
      selectedAccount = accounts[0];
    }

    console.log("🎯 Selected account:", selectedAccount);

    // Step 5: Create provider and signer
    console.log("🔗 Creating provider and signer...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    console.log("🌐 Connected to network:", network.name, `(chainId: ${network.chainId})`);

    const signer = await provider.getSigner(selectedAccount);
    const signerAddress = await signer.getAddress();

    if (signerAddress.toLowerCase() !== selectedAccount.toLowerCase()) {
      throw new Error("Signer address mismatch");
    }
    console.log("✅ Signer created for:", signerAddress);

    // Step 6: Request signature for authentication (with timeout)
    console.log("✍️ Requesting signature...");
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
      console.log("✅ Signature received");
    } catch (err) {
      console.error("❌ Signature error:", err);
      if (err?.code === 4001 || err?.message?.toLowerCase().includes("cancel")) {
        throw new Error("You cancelled the signature request");
      } else {
        throw err;
      }
    }

    // Step 7: Authenticate with backend
    console.log("🔐 Authenticating with backend...");
    let res;
    try {
      res = await axios.post(
        `http://localhost:3000/api/authentication?address=${selectedAccount}`,
        { signature }
      );
    } catch (err) {
      console.error("❌ Backend authentication failed:", err);
      throw new Error("Backend authentication failed");
    }

    if (!res?.data?.token) {
      console.error("❌ No token received from backend");
      throw new Error("No token received from backend");
    }

    // Step 8: Save to localStorage and create contract instance
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("address", selectedAccount);

    const contractAddress = "0xfa211F6fdD59A1f920823E64271329D5848D3903";
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    console.log("🎉 ========== CONNECTION SUCCESSFUL ==========");
    return { contractInstance, selectedAccount };
  } catch (error) {
    console.error("❌ ========== CONNECTION FAILED ==========");
    console.error("Error details:", error);
    // Re-throw so caller (Wallet.jsx) can handle UI/toasts consistently
    throw error;
  } finally {
    isConnecting = false;
    console.log("🏁 Connection process ended");
  }
};
