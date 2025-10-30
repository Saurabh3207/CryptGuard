import {
  FaClock,
  FaFilePdf,
  FaFileImage,
  FaFileAudio,
  FaFileAlt,
  FaDownload,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useWeb3Context } from "../../contexts/useWeb3Context";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import CryptoJS from "crypto-js";

const iconMap = {
  pdf: <FaFilePdf className="text-red-500 text-lg" />,
  image: <FaFileImage className="text-pink-500 text-lg" />,
  audio: <FaFileAudio className="text-yellow-500 text-lg" />,
  text: <FaFileAlt className="text-blue-500 text-lg" />,
  default: <FaFileAlt className="text-gray-500 text-lg" />,
};

const RecentUploadsCard = () => {
  const { web3State } = useWeb3Context();
  const { selectedAccount, contractInstance } = web3State;
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedAccount) return;
      try {
        // ✅ Tokens sent automatically via HttpOnly cookies
        const res = await axios.get(
          `http://localhost:3000/api/files/user/${selectedAccount}`,
          {
            withCredentials: true // Enable cookies
          }
        );
        const fetchedFiles = res.data.files.map((file) => {
          let type = "default";
          const name = file.fileName?.toLowerCase() || "";

          if (name.endsWith(".pdf")) type = "pdf";
          else if (name.match(/\.(jpg|jpeg|png|gif)$/)) type = "image";
          else if (name.match(/\.(mp3|wav|ogg)$/)) type = "audio";
          else if (name.match(/\.(txt|doc|docx)$/)) type = "text";

          return {
            ...file,
            type,
            size: file.fileSize
              ? (file.fileSize / (1024 * 1024)).toFixed(2) + " MB"
              : "Unknown",
            time: new Date(file.uploadTime).toLocaleString(),
          };
        });

        setFiles(fetchedFiles);
      } catch (error) {
        console.error("Error fetching recent uploads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedAccount]);

  const calculateFileHash = async (fileBlob) => {
    const buffer = await fileBlob.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return "0x" + hash;
  };

  const handleSecureDownload = async (file, index) => {
    setDownloadingIndex(index);
    toast.loading("Decrypting file...");

    try {
      // ✅ Tokens sent automatically via HttpOnly cookies
      const res = await axios.post(
        "http://localhost:3000/api/decryptAndDownload",
        {
          encryptedCID: file.ipfsCID,
          metadataCID: file.metadataCID,
          fileName: file.fileName,
        },
        {
          responseType: "blob",
          withCredentials: true // Enable cookies
        }
      );

      toast.dismiss();
      const decryptedBlob = res.data;
      
      // Optional blockchain verification - don't fail if blockchain is unavailable
      try {
        toast.loading("Verifying integrity...");
        const calculatedHash = await calculateFileHash(decryptedBlob);
        
        // Try blockchain verification
        const filesOnChain = await contractInstance.viewFiles();

        if (filesOnChain && filesOnChain.length > 0) {
          const fileIndex = filesOnChain.findIndex(
            (f) => f.fileHash.toLowerCase() === calculatedHash.toLowerCase()
          );

          if (fileIndex !== -1) {
            const isValid = await contractInstance.verifyFile(
              fileIndex,
              calculatedHash
            );
            
            if (!isValid) {
              toast.dismiss();
              toast.error("❌ File integrity failed!");
              return;
            }
            toast.dismiss();
            toast.success("✅ File verified on blockchain!");
          } else {
            // File not on blockchain, but allow download anyway
            toast.dismiss();
            toast("⚠️ File not on blockchain, but proceeding with download", { icon: "⚠️" });
          }
        } else {
          // No files on blockchain yet
          toast.dismiss();
          toast("⚠️ Blockchain verification skipped - no files on chain", { icon: "ℹ️" });
        }
      } catch (verifyErr) {
        toast.dismiss();
        console.warn("Blockchain verification failed:", verifyErr);
        toast("⚠️ Blockchain verification unavailable, proceeding with download", { 
          icon: "⚠️",
          duration: 3000 
        });
      }

      // Download file regardless of blockchain verification
      const link = document.createElement("a");
      link.href = URL.createObjectURL(decryptedBlob);
      link.download = file.fileName || "CryptGuard_File";
      link.click();
      
      toast.success("✅ Download completed!");
      
    } catch (err) {
      toast.dismiss();
      console.error("Download error:", err);
      toast.error("❌ Download failed: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white p-2 rounded-full">
            <FaClock />
          </span>
          Recent Uploads
        </h3>

        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400 animate-pulse">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No recent uploads.
          </div>
        ) : (
          <ul className="space-y-3">
            {files.slice(0, 3).map((file, index) => {
              const icon = iconMap[file.type] || iconMap.default;
              return (
                <li
                  key={index}
                  className="flex items-center justify-between px-4 py-2 rounded-lg border hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-3 truncate">
                    {icon}
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium text-gray-800 break-all">
                        {file.fileName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {file.size} • {file.time}
                      </span>
                    </div>
                  </div>
                  <button
                    title="Download"
                    aria-label="Download securely"
                    onClick={() => handleSecureDownload(file, index)}
                    className="text-gray-400 hover:text-indigo-600 hover:scale-110 transition-transform duration-200 ease-in-out text-sm"
                  >
                    {downloadingIndex === index ? (
                      <svg
                        className="animate-spin h-4 w-4 text-indigo-600"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                    ) : (
                      <FaDownload />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && files.length > 0 && (
        <div className="mt-4 text-right">
          <button
            onClick={() => navigate("/home/vault")}
            className="text-sm font-medium text-violet-600 hover:underline hover:text-violet-800 transition"
          >
            View All
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentUploadsCard;
