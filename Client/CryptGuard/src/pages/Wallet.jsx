import React from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { FaShieldAlt, FaBolt, FaUserSecret, FaGlobe } from "react-icons/fa";
import { motion } from "framer-motion";
import { useWeb3Context } from "../contexts/useWeb3Context";
import { connectWallet } from "../utils/connectWallet";

const ConnectWallet = () => {
  const web3State = useWeb3Context();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 flex justify-center items-center">
        <div className="w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl animate-ping"></div>
        <div className="w-72 h-72 bg-purple-500 opacity-20 rounded-full blur-2xl animate-ping delay-200"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10"
      >
        <h1 className="text-6xl font-extrabold mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 animate-gradient">CryptGuard</span>
        </h1>
        <h2 className="text-3xl font-semibold mb-6">Secure Your Files with CryptGuard</h2>
        <p className="mb-4 text-lg">Connect your MetaMask wallet to get started</p>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-8 rounded-full text-xl shadow-lg transition-transform"
          >
            Connect with MetaMask
          </Button>
        </motion.div>
        <p className="mt-4 text-yellow-400">🦊 MetaMask Required: Install MetaMask to securely connect your wallet.</p>
        <a href="https://metamask.io/download.html" className="text-blue-400 underline mt-1 inline-block text-lg">
          Don’t have MetaMask? Install Now
        </a>
        {web3State.selectedAccount && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Connected Wallet</span>
              <span className="text-sm text-emerald-400">Connected</span>
            </div>
            <div className="mt-2 font-mono text-sm break-all">{web3State.selectedAccount}</div>
          </div>
        )}
        <p className="text-sm text-gray-400 mt-3">
          By connecting, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 w-full max-w-5xl z-10">
        {[{
          icon: <FaShieldAlt className="text-blue-400 text-5xl" />,
          title: "Enhanced Security",
          description: "Military-grade encryption protecting your files with blockchain technology",
          color: "blue"
        }, {
          icon: <FaBolt className="text-purple-400 text-5xl" />,
          title: "Fast Access",
          description: "Lightning-fast file access and sharing with decentralized storage",
          color: "purple"
        }, {
          icon: <FaUserSecret className="text-indigo-400 text-5xl" />,
          title: "Privacy First",
          description: "Your data remains private and encrypted end-to-end",
          color: "indigo"
        }, {
          icon: <FaGlobe className="text-green-400 text-5xl" />,
          title: "24/7 Availability",
          description: "Access your files anytime, anywhere with guaranteed uptime",
          color: "green"
        }].map((feature, idx) => (
          <Card key={idx} className={`bg-gray-800 border border-${feature.color}-500 text-white shadow-xl transform hover:scale-105 transition-transform rounded-2xl`}>
            <CardContent className="flex items-center p-6 space-x-5">
              {feature.icon}
              <div>
                <h3 className="text-2xl font-bold mb-1">{feature.title}</h3>
                <p className="text-md text-gray-400">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap justify-center space-x-6 text-gray-400 mt-16 text-lg z-10">
        <p className="flex items-center space-x-2"><FaShieldAlt className="text-blue-400" /> <span>AES-256 Encrypted</span></p>
        <p className="flex items-center space-x-2"><FaUserSecret className="text-purple-400" /> <span>Blockchain Secured</span></p>
        <p className="flex items-center space-x-2"><FaBolt className="text-indigo-400" /> <span>Anti-Virus Protected</span></p>
        <p className="flex items-center space-x-2"><FaGlobe className="text-green-400" /> <span>Version Control</span></p>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-gray-500 text-sm z-10">
        © 2025 CryptGuard. All rights reserved.
      </footer>
    </div>
  );
};

export default ConnectWallet;