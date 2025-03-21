import { ethers } from "ethers";
import contractAbi from "../constants/contractAbi.json";
import { toast } from "react-hot-toast";
import axios from "axios";

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to connect."
      );
    }

    // Request accounts from MetaMask
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const selectedAccount = accounts[0];

    // Create an Ethereum provider from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Get the signer (the user who connected their wallet)
    const signer = await provider.getSigner();

    const message =
      "Welcome to CryptGuard! Please sign this message to authenticate your account";
    const signature = await signer.signMessage(message);

    const dataSignature = {
      signature,
    };

    const url = `http://localhost:3000/api/authentication?address=${selectedAccount}`;
    const res = await axios.post(url, dataSignature);
    console.log("Response: ", res.data);

    // Define your contract address and the contract ABI
    const contractAddress = "0xfa211F6fdD59A1f920823E64271329D5848D3903";
    const contractInstance = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );

    // Return the contract instance and the connected account address
    return { contractInstance, selectedAccount };
  } catch (error) {
    console.error(error);
    toast.error("Wallet connection failed: " + error.message, {
      style: {
        border: "1px solid #FF0000",
        padding: "8px 16px",
        color: "#FF0000",
        fontSize: "14px",
      },
      iconTheme: {
        primary: "#FF0000",
        secondary: "#FFFAEE",
      },
    });
    return { contractInstance: null, selectedAccount: null };
  }
};
