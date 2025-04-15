import React from "react";
import { useWeb3Context } from "../contexts/useWeb3Context";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UploadFile from "../components/UploadFile";
import WalletStatusCard from "../components/ui/WalletStatusCard";
import FileCategoriesCard from "../components/ui/FileCategoriesCard";
import DateTimeCard from "../components/ui/DateTimeCard";
import FileStatsCard from "../components/ui/FileStatsCard";
import RecentUploadsCard from "../components/ui/RecentUploadsCard";
import { motion } from "framer-motion";

import {
  FaWallet,
  FaCloudUploadAlt,
  FaLock,
  FaShareAlt,
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

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const handleSignOut = () => {
    updateWeb3State({ selectedAccount: null, contractInstance: null });
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", icon: <MdDashboard />, href: "/home" },
    { label: "Upload Files", icon: <FaCloudUploadAlt />, href: "/upload" },
    { label: "My Vault", icon: <FaLock />, href: "/vault" },
    { label: "Shared Files", icon: <FaShareAlt />, href: "/shared" },
    { label: "Settings", icon: <MdSettings />, href: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          bg-gradient-to-b from-violet-800 to-indigo-900 text-white shadow-xl transition-all duration-300
          fixed md:static top-0 left-0 h-full z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 w-64
        `}
      >
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
                location.pathname === item.href
                  ? "bg-white/10 text-white font-semibold border-l-4 border-white"
                  : "text-gray-300 hover:bg-white/10"
              }`}
              onClick={() => {
                if (isMobile) {
                  setSidebarOpen(false); // auto-close on mobile
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/support"
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
        <div className="flex-1 px-8 py-10 overflow-y-auto space-y-12 bg-gray-50">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
  <motion.div
    className="h-full"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="h-full">
    <WalletStatusCard selectedAccount={selectedAccount} />

    </div>
  </motion.div>
  <motion.div
    className="h-full"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <div className="h-full">
      <DateTimeCard />
    </div>
  </motion.div>
</div>


          {/* Upload Section */}
    {/* Upload Section */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="group bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 text-white w-full transition-all duration-300"
>
  <div className="flex items-center justify-between mb-6 sm:mb-8">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-1">Upload Your Files</h2>
      <p className="text-sm sm:text-base text-indigo-100">
        Secure, encrypted, and instantly accessible
      </p>
    </div>

    {/* Animated icon on hover */}
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md">
      <FaCloudUploadAlt className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200 ease-in-out" />
    </div>
  </div>


  {/* Drop Zone */}
  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-dashed border-white/30 hover:border-white/50 transition-all duration-300">
    <UploadFile />
  </div>
</motion.div>


          {/* Bottom Cards - Reordered Layout */}
<div className="space-y-6">
  {/* File Categories Full Width */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <FileCategoriesCard />
    </div>
  </motion.div>

  {/* Side-by-side for File Stats and Recent Uploads */}
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
         {/* Footer */}
<motion.footer
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6 }}
  className="w-full mt-16"
>
  <div className="relative overflow-hidden rounded-t-xl">
    {/* Top Gradient Border Accent */}
    <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 animate-pulse" />

    <div className="bg-white py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
      {/* Branding */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <i className="fas fa-lock text-violet-500 text-lg" />
        <span className="font-semibold text-gray-600">CryptGuard Vault</span>
        <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()}</span>
      </div>

      {/* Links or Info */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <a
          href="#"
          className="hover:text-violet-600 transition duration-300"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="hover:text-violet-600 transition duration-300"
        >
          Terms
        </a>
        <span className="text-xs bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-2 py-0.5 rounded-full shadow-md font-medium tracking-wide">
          v1.0.0
        </span>
      </div>
    </div>
  </div>
</motion.footer>

        </div>
      </main>
    </div>
  );
};

export default Home;
