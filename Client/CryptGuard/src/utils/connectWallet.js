// utils/connectWallet.js

import { ethers } from "ethers";
import contractAbi from "../constants/contractAbi.json";
import axios from "axios";
import { toast } from "react-hot-toast";

let isConnecting = false; // Prevents multiple MetaMask requests

export const connectWallet = async () => {
  if (isConnecting) {
    toast("⏳ Already connecting to MetaMask...");
    return { contractInstance: null, selectedAccount: null };
  }

  isConnecting = true;

  try {
    if (!window.ethereum) {
      toast.error("🦊 MetaMask not found. Please install it first.");
      throw new Error("🦊 MetaMask not found. Please install it first.");
    }

    // Timeout for MetaMask popup
    const requestAccounts = () => {
      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          reject(new Error("MetaMask popup timed out. Please check your browser and try again."));
        }, 15000);
        window.ethereum.request({ method: "eth_requestAccounts" })
          .then((accounts) => {
            clearTimeout(timeout);
            resolve(accounts);
          })
          .catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
      });
    };

    const accounts = await requestAccounts();
    console.log("📋 Accounts received:", accounts);

    if (!accounts || accounts.length === 0) {
      toast.error("No accounts found. Please unlock MetaMask.");
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    const selectedAccount = accounts[0];
    console.log("🎯 Selected account:", selectedAccount);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    console.log("✍️ Requesting signature...");

    // Sign message with timeout
    const message = "Welcome to CryptGuard! Please sign this message to authenticate your account";
    let signature;
    try {
      signature = await Promise.race([
        signer.signMessage(message),
        new Promise((_, reject) => setTimeout(() => reject(new Error("MetaMask signature popup timed out. Please check your browser and try again.")), 15000))
      ]);
    } catch (err) {
      if (err.code === 4001 || err.message.includes("User rejected")) {
        toast.error("Signature request was cancelled by user.");
      } else {
        toast.error(err.message || "Signature request failed.");
      }
      throw err;
    }

    console.log("🔐 Signature received, authenticating...");

    let res;
    try {
      res = await axios.post(
        `http://localhost:3000/api/authentication?address=${selectedAccount}`,
        { signature }
      );
    } catch (err) {
      toast.error("Backend authentication failed. Please check server logs.");
      throw err;
    }

    if (!res.data.token) {
      toast.error("No token received from backend. Check server implementation.");
      throw new Error("No token received from backend.");
    }

    console.log("🎉 Authentication successful");

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("address", selectedAccount);

    const contractAddress = "0xfa211F6fdD59A1f920823E64271329D5848D3903"; // ✅ Your deployed contract
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    return { contractInstance, selectedAccount };
  } catch (error) {
    console.error("❌ Wallet connection error:", error);
    
    // Handle specific MetaMask errors
    if (error.code === 4001) {
      toast.error("🚫 Connection rejected by user");
    } else if (error.code === -32002) {
      toast.error("⏳ MetaMask is already processing a request");
    } else if (error.message.includes("User rejected")) {
      toast.error("🚫 Connection rejected by user");
    } else if (error.message.includes("already pending")) {
      toast.error("⏳ Connection request already pending");
    } else {
      toast.error("❌ " + error.message);
    }
    
    return { contractInstance: null, selectedAccount: null };
  } finally {
    isConnecting = false;
  }
};
