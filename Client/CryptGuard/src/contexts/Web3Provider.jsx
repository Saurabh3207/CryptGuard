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
      if (window.ethereum && address && token) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === address.toLowerCase()) {
            // Recreate contract instance
            const { ethers } = await import("ethers");
            const contractAbi = (await import("../constants/contractAbi.json")).default;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractAddress = "0xfa211F6fdD59A1f920823E64271329D5848D3903";
            const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
            setWeb3State({ contractInstance, selectedAccount: address });
          }
        } catch (err) {
          // If error, clear state
          setWeb3State({ contractInstance: null, selectedAccount: null });
        }
      }
    }
    checkMetaMask();
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (!accounts || accounts.length === 0) {
          setWeb3State({ contractInstance: null, selectedAccount: null });
          localStorage.removeItem("address");
          localStorage.removeItem("token");
        } else {
          setWeb3State((prev) => ({ ...prev, selectedAccount: accounts[0] }));
          localStorage.setItem("address", accounts[0]);
        }
      });
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