import { useState } from "react";
import { FaWallet, FaCheckCircle, FaTimesCircle, FaRegCopy } from "react-icons/fa";
import { toast } from "react-hot-toast";

const WalletStatusCard = ({ selectedAccount }) => {
  const isConnected = !!selectedAccount;
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const copyToClipboard = () => {
    if (selectedAccount) {
      navigator.clipboard.writeText(selectedAccount);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`h-full ${
        isConnected
          ? "bg-gradient-to-r from-teal-400 to-green-500"
          : "bg-gradient-to-r from-red-400 to-pink-500"
      } text-white rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col gap-4 justify-between transition-all duration-500`}
    >
      {/* Top-right label */}
      <span className="absolute top-4 right-4 text-xs font-medium text-white/80">
        Wallet Status
      </span>

      {/* Status */}
      <div className="flex items-center gap-3">
        {isConnected ? (
          <>
            <FaCheckCircle className="text-white text-2xl" />
            <div className="text-lg sm:text-xl font-semibold">Connected</div>
          </>
        ) : (
          <>
            <FaTimesCircle className="text-white text-2xl" />
            <div className="text-lg sm:text-xl font-semibold">Disconnected</div>
          </>
        )}
      </div>

      <div className="border-t border-white/30 my-2" />

      {/* Secure + Address Row */}
      <div className="flex justify-between items-center text-sm text-white/90">
        <div className="flex items-center gap-2">
          <FaWallet className="text-sm" />
          {isConnected ? "Secure Connection" : "Wallet not connected"}
        </div>

        {/* Address + Copy */}
        {isConnected && (
          <div className="flex items-center gap-1 text-xs text-white/80 font-mono">
            <span>{shortenAddress(selectedAccount)}</span>
            <button
              onClick={copyToClipboard}
              className="text-white/60 hover:text-white transition"
              title="Copy to clipboard"
            >
              <FaRegCopy />
            </button>
            {copied && (
              <span className="text-green-100 text-[10px] font-bold">Copied!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletStatusCard;
