// pages/Wallet.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { FaShieldAlt, FaBolt, FaUserSecret, FaGlobe } from "react-icons/fa";
import { motion } from "framer-motion";
import { useWeb3Context } from "../contexts/useWeb3Context";
import { connectWallet } from "../utils/connectWallet";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import logger from "../utils/logger";

const Wallet = () => {
  const navigateTo = useNavigate();
  const { updateWeb3State, web3State } = useWeb3Context();
  const { selectedAccount } = web3State;

  const [loading, setLoading] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);

  /** ✅ Detect MetaMask availability once */
  useEffect(() => {
    const isMetaMask =
      typeof window !== "undefined" &&
      window.ethereum &&
      window.ethereum.isMetaMask;
    setMetaMaskInstalled(Boolean(isMetaMask));
  }, []);

  /** ✅ Auto-navigate if account already connected */
  useEffect(() => {
    if (selectedAccount) {
      navigateTo("/home");
    }
  }, [selectedAccount, navigateTo]);

  /** ✅ Main connection handler */
  const handleWalletConnection = useCallback(async () => {
    logger.debug("🔘 Connect Wallet Clicked");

    if (loading) return;
    if (!metaMaskInstalled) {
      toast.error(
        (t) => (
          <div className="flex items-start gap-3">
            <span className="text-2xl">🦊</span>
            <div>
              <p className="font-semibold text-gray-900">MetaMask Not Found</p>
              <p className="text-sm text-gray-600 mt-1">Please install MetaMask browser extension to continue</p>
            </div>
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );
      return;
    }

    setLoading(true);
    
    // Show connecting toast
    const connectingToast = toast.loading(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-xl">🔄</span>
          <div>
            <p className="font-semibold text-gray-900">Connecting...</p>
            <p className="text-sm text-gray-600">Please approve in MetaMask</p>
          </div>
        </div>
      ),
      {
        style: {
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          padding: '16px',
          borderRadius: '12px',
        },
      }
    );
    
    try {
      // Simple, clean connection
      const { contractInstance, selectedAccount: account } =
        await connectWallet();

      if (!account) {
        throw new Error("Connection cancelled or failed");
      }

      updateWeb3State({ contractInstance, selectedAccount: account });
      
      // Dismiss loading toast and show success
      toast.dismiss(connectingToast);
      toast.success(
        (t) => (
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-900">Wallet Connected!</p>
              <p className="text-sm text-gray-600 mt-1">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <p className="text-xs text-green-600 mt-1">Redirecting to dashboard...</p>
            </div>
          </div>
        ),
        {
          duration: 3000,
          style: {
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );

      logger.debug("🟢 Connected Account:", account);
    } catch (error) {
      logger.error("❌ Error connecting wallet:", error);
      
      // Dismiss loading toast
      toast.dismiss(connectingToast);
      
      // Show appropriate error message
      if (error?.message?.includes("MetaMask is locked")) {
        toast.error(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-gray-900">MetaMask is Locked</p>
                <p className="text-sm text-gray-600 mt-1">Please unlock MetaMask and try again</p>
                <p className="text-xs text-orange-600 mt-2">💡 Click the MetaMask icon in your browser</p>
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
      } else if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
        // User rejected - show subtle message
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-xl">👋</span>
              <div>
                <p className="font-semibold text-gray-900">Connection Cancelled</p>
                <p className="text-sm text-gray-600 mt-1">You can connect anytime you're ready</p>
              </div>
            </div>
          ),
          {
            duration: 3000,
            style: {
              background: '#F9FAFB',
              border: '1px solid #D1D5DB',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
      } else {
        toast.error(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-gray-900">Connection Failed</p>
                <p className="text-sm text-gray-600 mt-1">
                  {error?.message || "Something went wrong. Please try again."}
                </p>
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
      }
    } finally {
      setLoading(false);
    }
  }, [loading, metaMaskInstalled, updateWeb3State]);

  /** ✅ Optional: Recheck MetaMask account change */
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-xl">🔌</span>
              <div>
                <p className="font-semibold text-gray-900">Wallet Disconnected</p>
                <p className="text-sm text-gray-600 mt-1">Your wallet has been disconnected</p>
              </div>
            </div>
          ),
          {
            duration: 4000,
            style: {
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
        updateWeb3State({ contractInstance: null, selectedAccount: null });
      } else {
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <span className="text-xl">🔄</span>
              <div>
                <p className="font-semibold text-gray-900">Account Switched</p>
                <p className="text-sm text-gray-600 mt-1">
                  {accounts[0].slice(0, 6)}...{accounts[0].slice(-4)}
                </p>
              </div>
            </div>
          ),
          {
            duration: 3000,
            style: {
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
        updateWeb3State((prev) => ({
          ...prev,
          selectedAccount: accounts[0],
        }));
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [updateWeb3State]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '500px',
          },
          // Individual toast type styles
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      {/* Animated Background */}
      <div className="absolute inset-0 flex justify-center items-center">
        <div className="w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl animate-ping"></div>
        <div className="w-72 h-72 bg-purple-500 opacity-20 rounded-full blur-2xl animate-ping delay-200"></div>
      </div>

      {/* Main Wallet UI */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10"
      >
        <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          CryptGuard
        </h1>
        <h2 className="text-3xl font-semibold mb-6">
          Secure Your Files with CryptGuard
        </h2>
        <p className="mb-4 text-lg">
          Connect your MetaMask wallet to get started
        </p>

        <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleWalletConnection}
            disabled={loading || !metaMaskInstalled}
            className={`py-3 px-8 rounded-full text-xl shadow-lg transition-transform ${
              metaMaskInstalled
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Connecting..."
              : selectedAccount
              ? `Connected: ${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`
              : metaMaskInstalled
              ? "Connect with MetaMask"
              : "Install MetaMask First"}
          </Button>
        </motion.div>

        {/* Subtle inline warning - always visible, non-intrusive */}
        {metaMaskInstalled && !selectedAccount && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-yellow-400">⚠️</span>
            <span className="text-gray-300">
              Ensure MetaMask is <strong className="text-white">unlocked</strong> before connecting
            </span>
          </motion.div>
        )}

        <div className="mt-4">
          {metaMaskInstalled ? (
            <p className="text-green-400 text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              MetaMask Ready
            </p>
          ) : (
            <div className="mt-4">
              <p className="text-yellow-400 text-sm mb-2">⚠️ MetaMask extension required</p>
              <a
                href="https://metamask.io/download.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
              >
                Install MetaMask
              </a>
            </div>
          )}
        </div>

        {/* Collapsible detailed help - closed by default, available on click */}
        {metaMaskInstalled && !selectedAccount && (
          <motion.details
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 max-w-lg mx-auto"
        >
          <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-center text-sm font-medium py-2 px-4 rounded-lg bg-blue-900/10 hover:bg-blue-900/20 transition-all">
            💡 First time connecting? Click for step-by-step guide
          </summary>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg mt-3 p-4">
            <p className="text-blue-300 font-semibold text-sm mb-3">
              Connection Steps:
            </p>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold min-w-[20px]">1.</span>
                <span>Click the <strong className="text-white">MetaMask 🦊 icon</strong> in your browser toolbar</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold min-w-[20px]">2.</span>
                <span>If you see a lock screen, enter your password to <strong className="text-white">unlock MetaMask</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold min-w-[20px]">3.</span>
                <span>Click the <strong className="text-white">"Connect with MetaMask"</strong> button above</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold min-w-[20px]">4.</span>
                <span>Approve the connection popup that appears</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold min-w-[20px]">5.</span>
                <span>Sign the authentication message to complete setup</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <p className="text-xs text-gray-400 italic">
                ⚠️ Important: If MetaMask is locked, the connection will timeout. Always unlock first!
              </p>
            </div>
          </div>
        </motion.details>
        )}

        <p className="text-sm text-gray-400 mt-6">
          By connecting, you agree to our{" "}
          <a href="#" className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline">
            Privacy Policy
          </a>
        </p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 w-full max-w-5xl z-10">
        {[
          {
            icon: <FaShieldAlt className="text-blue-400 text-5xl" />,
            title: "Enhanced Security",
            description:
              "Military-grade encryption protecting your files with blockchain technology",
            glowClass: "glow-blue",
          },
          {
            icon: <FaBolt className="text-purple-400 text-5xl" />,
            title: "Fast Access",
            description:
              "Lightning-fast file access and sharing with decentralized storage",
            glowClass: "glow-purple",
          },
          {
            icon: <FaUserSecret className="text-indigo-400 text-5xl" />,
            title: "Privacy First",
            description:
              "Your data remains private and encrypted end-to-end",
            glowClass: "glow-indigo",
          },
          {
            icon: <FaGlobe className="text-green-400 text-5xl" />,
            title: "24/7 Availability",
            description:
              "Access your files anytime, anywhere with guaranteed uptime",
            glowClass: "glow-green",
          },
        ].map((feature, idx) => (
          <Card key={idx} className={`border-4 ${feature.glowClass}`}>
            <CardContent className="flex items-center space-x-5">
              {feature.icon}
              <div>
                <h3 className="text-2xl font-bold mb-1">{feature.title}</h3>
                <p className="text-md text-gray-400">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-gray-500 text-sm z-10">
        © 2025 CryptGuard. All rights reserved.
      </footer>
    </div>
  );
};

export default Wallet;
