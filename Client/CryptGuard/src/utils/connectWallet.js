
export const connectWallet = async() => {
if (!window.ethereum) {
    throw new Error("Metamask is not installed on your browser. Please install it on your browser to continue.");
  }
  const accounts = await window.ethereum.request({ 
    method: "eth_requestAccounts" 
});
console.log(accounts[0]);
}