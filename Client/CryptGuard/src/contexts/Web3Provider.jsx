import React, { useState } from "react";
import { Web3Context } from "./createWeb3Context";
import logger from "../utils/logger";
import { useSessionTimer } from "../hooks/useSessionTimer";
import SessionExpiryWarning from "../components/ui/SessionExpiryWarning";

const Web3Provider = ({children}) => {

  const [web3State, setWeb3State] = useState({
    contractInstance: null,
    selectedAccount: null,
  });

  // Integrate session timer
  const isAuthenticated = !!web3State.selectedAccount;
  const {
    showWarning,
    extendSession,
    endSession,
    recordActivity,
    formatTimeRemaining,
  } = useSessionTimer(isAuthenticated);

  // Auto-reconnect wallet on refresh
  React.useEffect(() => {
    const address = localStorage.getItem("address");
    // ✅ FIX: Tokens are stored in HttpOnly cookies, not localStorage
    // Just check for address and MetaMask availability
    
    async function checkMetaMask() {
      const hasRequirements = window.ethereum && address;
      
      if (!hasRequirements) {
        return;
      }
      
      logger.debug("Web3Provider: Attempting auto-reconnection");
      
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        
        if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === address.toLowerCase()) {
          logger.debug("Web3Provider: Reconnecting to", address.slice(0, 6) + "..." + address.slice(-4));
          const { ethers } = await import("ethers");
          const contractAbi = (await import("../constants/contractAbi.json")).default;
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          const signer = await provider.getSigner(address);
          const signerAddress = await signer.getAddress();
          
          const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
          if (!contractAddress) {
            throw new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS in environment variables.");
          }
          const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
          
          setWeb3State({ contractInstance, selectedAccount: address });
          logger.success("Web3Provider: Auto-reconnection successful");
        } else {
          logger.warn("Web3Provider: Account mismatch, clearing state");
          localStorage.removeItem("address");
          setWeb3State({ contractInstance: null, selectedAccount: null });
        }
      } catch (err) {
        logger.error("Web3Provider: Auto-reconnect failed:", err.message);
        localStorage.removeItem("address");
        setWeb3State({ contractInstance: null, selectedAccount: null });
      }
    }
    
    checkMetaMask();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        logger.debug("Accounts changed:", accounts);
        if (!accounts || accounts.length === 0) {
          logger.warn("No accounts available");
          setWeb3State({ contractInstance: null, selectedAccount: null });
          localStorage.removeItem("address");
        } else {
          logger.debug("Account switched to:", accounts[0]);
          setWeb3State((prev) => ({ ...prev, selectedAccount: accounts[0] }));
          localStorage.setItem("address", accounts[0]);
        }
      };
      
      const handleChainChanged = (chainId) => {
        logger.debug("Network changed to chainId:", chainId);
        window.location.reload();
      };
      
      const handleConnect = (connectInfo) => {
        logger.debug("Provider connected:", connectInfo);
      };
      
      const handleDisconnect = (error) => {
        logger.warn("Provider disconnected:", error);
        setWeb3State({ contractInstance: null, selectedAccount: null });
        localStorage.removeItem("address");
      };
      
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("connect", handleConnect);
      window.ethereum.on("disconnect", handleDisconnect);
      
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
    
    // Record activity when state updates (user interaction)
    if (isAuthenticated) {
      recordActivity();
    }
  };

  // Record activity on user interactions
  React.useEffect(() => {
    const handleUserActivity = () => {
      if (isAuthenticated) {
        recordActivity();
      }
    };

    // Listen to user activity events
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
    };
  }, [isAuthenticated, recordActivity]);

  return (
    <Web3Context.Provider value={{ web3State, updateWeb3State }}>
      {children}
      
      {/* Session Expiry Warning Modal */}
      <SessionExpiryWarning
        isOpen={showWarning}
        onExtend={extendSession}
        onLogout={endSession}
        timeRemaining={formatTimeRemaining()}
      />
    </Web3Context.Provider>
  );
}

export default Web3Provider;