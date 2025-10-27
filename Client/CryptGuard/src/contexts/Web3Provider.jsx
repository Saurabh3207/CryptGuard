import React, { useState } from "react";
import { Web3Context } from "./createWeb3Context";

const Web3Provider = ({children}) => {


  const [web3State, setWeb3State] = useState({
    contractInstance: null,
    selectedAccount: null,
  });

  // Auto-reconnect wallet on refresh
  React.useEffect(() => {
    const address = localStorage.getItem("address");
    const token = localStorage.getItem("token");
    
    async function checkMetaMask() {
      // Only log if something interesting happens
      const hasRequirements = window.ethereum && address && token;
      
      if (!hasRequirements) {
        // Silent check - only log in dev mode if needed
        // console.log("ℹ️ Web3Provider: Waiting for connection...");
        return;
      }
      
      // Has requirements - attempt reconnection
      console.log("� Web3Provider: Auto-reconnecting wallet...");
      
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        
        if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === address.toLowerCase()) {
          console.log("✅ Web3Provider: Reconnecting to", address.slice(0, 6) + "..." + address.slice(-4));
          // Recreate contract instance with latest ethers.js v6 patterns
          const { ethers } = await import("ethers");
          const contractAbi = (await import("../constants/contractAbi.json")).default;
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // Explicitly get signer for the stored address
          const signer = await provider.getSigner(address);
          
          // Verify signer address
          const signerAddress = await signer.getAddress();
          
          const contractAddress = "0xfa211F6fdD59A1f920823E64271329D5848D3903";
          const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
          
          setWeb3State({ contractInstance, selectedAccount: address });
          console.log("✅ Web3Provider: Auto-reconnection successful");
        } else {
          // Account mismatch - clear everything
          console.warn("⚠️ Web3Provider: Account mismatch, clearing state");
          localStorage.removeItem("address");
          localStorage.removeItem("token");
          setWeb3State({ contractInstance: null, selectedAccount: null });
        }
      } catch (err) {
        // If error, clear state and localStorage
        console.error("❌ Web3Provider: Auto-reconnect failed:", err.message);
        localStorage.removeItem("address");
        localStorage.removeItem("token");
        setWeb3State({ contractInstance: null, selectedAccount: null });
      }
    }
    
    checkMetaMask();
    
    // Listen for EIP-1193 provider events
    if (window.ethereum) {
      // Account changes
      const handleAccountsChanged = (accounts) => {
        console.log("🔄 Accounts changed:", accounts);
        if (!accounts || accounts.length === 0) {
          console.log("⚠️ No accounts available");
          setWeb3State({ contractInstance: null, selectedAccount: null });
          localStorage.removeItem("address");
          localStorage.removeItem("token");
        } else {
          console.log("✅ Account switched to:", accounts[0]);
          setWeb3State((prev) => ({ ...prev, selectedAccount: accounts[0] }));
          localStorage.setItem("address", accounts[0]);
        }
      };
      
      // Chain/Network changes
      const handleChainChanged = (chainId) => {
        console.log("🌐 Network changed to chainId:", chainId);
        // Reload the page on network change (recommended by MetaMask)
        window.location.reload();
      };
      
      // Connection changes
      const handleConnect = (connectInfo) => {
        console.log("✅ Provider connected:", connectInfo);
      };
      
      const handleDisconnect = (error) => {
        console.log("⚠️ Provider disconnected:", error);
        setWeb3State({ contractInstance: null, selectedAccount: null });
        localStorage.removeItem("address");
        localStorage.removeItem("token");
      };
      
      // Attach listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("connect", handleConnect);
      window.ethereum.on("disconnect", handleDisconnect);
      
      // Cleanup function
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          window.ethereum.removeListener("connect", handleConnect);
          window.ethereum.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, []);

  const updateWeb3State = (newState) => {
    setWeb3State((prevState) => ({
      ...prevState,
      ...newState,
    }));
  };

  return (
    <Web3Context.Provider value={{ web3State, updateWeb3State }}>
      {children}
    </Web3Context.Provider>
  );
}

export default Web3Provider;