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
      throw new Error("🦊 MetaMask not found. Please install it first.");
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const selectedAccount = accounts[0];

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Sign message
    const message = "Welcome to CryptGuard! Please sign this message to authenticate your account";
    const signature = await signer.signMessage(message);

    const res = await axios.post(
      `http://localhost:3000/api/authentication?address=${selectedAccount}`,
      { signature }
    );

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("address", selectedAccount);

    const contractAddress = "0xfa211F6fdD59A1f920823E64271329D5848D3903"; // ✅ Your deployed contract
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    return { contractInstance, selectedAccount };
  } catch (error) {
    console.error("Wallet connection error:", error);
    toast.error("❌ " + error.message);
    return { contractInstance: null, selectedAccount: null };
  } finally {
    isConnecting = false;
  }
};
