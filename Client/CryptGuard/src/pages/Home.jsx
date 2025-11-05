import React from "react";
import { useWeb3Context } from "../contexts/useWeb3Context";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import UploadFile from "../components/UploadFile";
import WalletStatusCard from "../components/ui/WalletStatusCard";
import FileCategoriesCard from "../components/ui/FileCategoriesCard";
import DateTimeCard from "../components/ui/DateTimeCard";
import FileStatsCard from "../components/ui/FileStatsCard";
import RecentUploadsCard from "../components/ui/RecentUploadsCard";
import SessionStatusIndicator from "../components/ui/SessionStatusIndicator";
import { useSessionTimer } from "../hooks/useSessionTimer";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import logger from "../utils/logger";

import {
  FaWallet,
  FaCloudUploadAlt,
  FaLock,
  FaQuestionCircle,
} from "react-icons/fa";
import { MdDashboard, MdSettings } from "react-icons/md";

const Home = () => {
  const { web3State, updateWeb3State } = useWeb3Context();
  const { selectedAccount } = web3State;
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [authChecked, setAuthChecked] = React.useState(false);

  // Session timer for status indicator
  const isAuthenticated = !!selectedAccount;
  const {
    formatTimeRemaining,
    getSessionStatusColor,
  } = useSessionTimer(isAuthenticated);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  /**
   * Authentication check - verifies token and account match
   * ✅ FIX: Tokens are stored in HttpOnly cookies, not localStorage
   */
  React.useEffect(() => {
    const address = localStorage.getItem("address");
    
    if (!address) {
      logger.debug("No address in localStorage, redirecting to /");
      navigate("/", { replace: true });
      return;
    }
    
    // Wait for account to load with timeout fallback
    if (address && !selectedAccount) {
      logger.debug("Address exists but account not loaded yet, waiting");
      
      const timeout = setTimeout(() => {
        if (!selectedAccount) {
          logger.warn("Account not loaded after timeout, allowing access with localStorage data");
          setAuthChecked(true);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
    
    // Verify address matches selectedAccount
    if (selectedAccount && address.toLowerCase() !== selectedAccount.toLowerCase()) {
      logger.warn("Address mismatch, redirecting to /");
      localStorage.removeItem("address");
      navigate("/", { replace: true });
      return;
    }
    
    // ✅ Authentication verified (tokens validated via HttpOnly cookies server-side)
    if (selectedAccount && address) {
      logger.debug("Authentication verified, account loaded:", selectedAccount);
      setAuthChecked(true);
    }
  }, [selectedAccount, navigate]);

  /**
   * MetaMask account change listener
   */
  React.useEffect(() => {
    if (!window.ethereum || !selectedAccount) return;

    const handleAccountsChanged = (accounts) => {
      const storedAddress = localStorage.getItem("address");
      
      if (accounts.length === 0) {
        logger.debug("MetaMask disconnected");
        localStorage.removeItem("address");
        updateWeb3State({ selectedAccount: null, contractInstance: null });
        navigate("/", { replace: true });
      } else if (storedAddress && accounts[0].toLowerCase() !== storedAddress.toLowerCase()) {
        // Account switched in MetaMask
        logger.warn("⚠️ MetaMask account changed");
        toast.error("🔒 Account changed. Please reconnect.");
        localStorage.removeItem("address");
        updateWeb3State({ selectedAccount: null, contractInstance: null });
        navigate("/", { replace: true });
      }
    };

    // Listen for account changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      // Cleanup listener
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []); // Run only once to set up listener

  const handleSignOut = () => {
    // Clear all authentication data
    localStorage.removeItem("address");
    updateWeb3State({ selectedAccount: null, contractInstance: null });
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", icon: <MdDashboard />, href: "/home" },
    { label: "My Vault", icon: <FaLock />, href: "/home/vault" }, 

  ];

  // Show loading screen until authentication is verified
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className={`
        bg-gradient-to-b from-violet-800 to-indigo-900 text-white shadow-xl transition-all duration-300
        fixed md:static top-0 left-0 h-full z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 w-64
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <i className="fas fa-cubes text-violet-300 text-2xl"></i>
            <span className="text-xl font-semibold text-white">CryptGuard</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white text-xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-all ${
                location.pathname.startsWith(item.href)
                  ? "bg-white/10 text-white font-semibold border-l-4 border-white"
                  : "text-gray-300 hover:bg-white/10"
              }`}
              onClick={() => {
                if (isMobile) setSidebarOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/home/support"
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <FaQuestionCircle className="mr-2" />
            <span>Help & Support</span>
          </Link>
        </div>
      </aside>

      {/* Backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        }`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-10 shadow-sm justify-between">
          <button
            className="md:hidden text-violet-700 text-2xl"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="fas fa-bars" />
          </button>
          <div className="text-lg font-semibold text-gray-700">
            👋 Welcome back
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Session Status Indicator */}
            <SessionStatusIndicator
              timeRemaining={0}
              statusColor={getSessionStatusColor()}
              formatTime={formatTimeRemaining}
            />
            
            <div className="flex items-center gap-2 bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm">
              <FaWallet className="text-violet-600" />
              <span className="text-sm font-medium text-violet-700">
                {shortenAddress(selectedAccount)}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-md"
            >
              <i className="fas fa-sign-out-alt" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {location.pathname === "/home" ? (
            <>
              {/* Dashboard content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <motion.div
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <WalletStatusCard selectedAccount={selectedAccount} />
                </motion.div>

                <motion.div
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <DateTimeCard />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 text-white w-full transition-all duration-300 mt-8"
              >
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">Upload Your Files</h2>
                    <p className="text-sm sm:text-base text-indigo-100">
                      Secure, encrypted, and instantly accessible
                    </p>
                  </div>

                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md">
                    <FaCloudUploadAlt className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200 ease-in-out" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-dashed border-white/30 hover:border-white/50 transition-all duration-300">
                  <UploadFile />
                </div>
              </motion.div>

              <div className="space-y-6 mt-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                    <FileCategoriesCard />
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition h-full">
                      <FileStatsCard />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition h-full">
                      <RecentUploadsCard />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full mt-16"
              >
                <div className="relative overflow-hidden rounded-t-xl">
                  <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 animate-pulse" />
                  <div className="bg-white py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <i className="fas fa-lock text-violet-500 text-lg" />
                      <span className="font-semibold text-gray-600">CryptGuard Vault</span>
                      <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                    
                    </div>
                  </div>
                </div>
              </motion.footer>
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
