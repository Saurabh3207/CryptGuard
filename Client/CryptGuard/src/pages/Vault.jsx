import { useEffect, useState } from "react";
import { useWeb3Context } from "../contexts/useWeb3Context";
import axios from "axios";
import {
  FaDownload,
  FaSearch,
  FaSync,
  FaImage,
  FaShieldAlt,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import CryptoJS from "crypto-js";

const GATEWAY_URL = "https://orange-urban-quelea-906.mypinata.cloud/ipfs/";

const Vault = () => {
  const { web3State } = useWeb3Context();
  const { selectedAccount, contractInstance } = web3State;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchFiles = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/files/user/${selectedAccount}`
      );
      setFiles(res.data.files || []);
    } catch (error) {
      console.error("Error fetching vault files:", error);
      toast.error("❌ Failed to fetch files. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedAccount]);

  const filteredFiles = files.filter((file) =>
    file.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateFileHash = async (fileBlob) => {
    const buffer = await fileBlob.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return "0x" + hash;
  };

  const findFileIndexFromContract = async (fileHash) => {
    try {
      const filesOnChain = await contractInstance.viewFiles(); // ✅ fixed
      const index = filesOnChain.findIndex(
        (f) => f.fileHash.toLowerCase() === fileHash.toLowerCase()
      );
      return index !== -1 ? index : null;
    } catch (err) {
      console.error("Error fetching from contract:", err);
      return null;
    }
  };
  

  const handleSecureDownload = async (file) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    toast.loading("🔐 Decrypting file...");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/decryptAndDownload",
        {
          encryptedCID: file.ipfsCID, // aligned with contract
          metadataCID: file.metadataCID,
          fileName: file.fileName,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.dismiss();
      const decryptedBlob = res.data;

      toast.loading("🛡️ Verifying file integrity...");

      const calculatedHash = await calculateFileHash(decryptedBlob);

      if (!contractInstance) {
        toast.error("Smart contract not connected.");
        return;
      }

      const index = await findFileIndexFromContract(file.fileHash);
      if (index === null) {
        toast.error("❌ Could not find file index on-chain.");
        return;
      }

      const isValid = await contractInstance.verifyFile(index, calculatedHash);
      toast.dismiss();

      if (!isValid) {
        toast.error("❌ File integrity check failed!");
        return;
      }

      toast.success("✅ Verified! Downloading...");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(decryptedBlob);
      link.download = file.fileName || "CryptGuard_File";
      link.click();
    } catch (err) {
      toast.dismiss();
      console.error("Secure download error:", err);
      toast.error("❌ Secure download failed.");
    }
  };

  const proceedWithDownload = () => {
    if (!selectedFile) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(selectedFile.blob);
    link.download = selectedFile.name || "CryptGuard_File";
    link.click();
    setModalOpen(false);
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShieldAlt className="text-violet-600" /> My Vault
        </h1>

        {/* Search and Refresh */}
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="flex items-center bg-white border border-violet-200 rounded-full px-4 py-2 shadow-md w-full sm:w-96">
            <FaSearch className="text-violet-500 mr-2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm text-gray-700 bg-transparent"
            />
          </div>
          <button
            onClick={fetchFiles}
            className="flex items-center justify-center bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-full p-2 shadow-md transition"
            title="Refresh Files"
          >
            <FaSync className="text-lg" />
          </button>
        </div>
      </div>

      {/* Files Section */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-6xl">📂</div>
          <h2 className="text-xl font-bold text-gray-700">Vault is Empty</h2>
          <p className="text-sm text-gray-500">
            Upload some files to see them here securely!
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {filteredFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-xl shadow hover:shadow-lg hover:scale-105 transition duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="text-lg font-medium text-gray-800 truncate">
                  {file.fileName}
                </div>
                <div className="text-xs text-gray-500">
                  {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(file.uploadTime).toLocaleString()}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                {file.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) && (
                  <a
                    href={`${GATEWAY_URL}${file.ipfsCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-xs sm:text-sm font-medium text-violet-600 bg-violet-100 hover:bg-violet-200 rounded-lg px-3 py-1.5 transition"
                  >
                    <FaImage className="inline mr-1" /> View
                  </a>
                )}
                <button
                  onClick={() => handleSecureDownload(file)}
                  className="text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 rounded-lg px-3 py-1.5 transition"
                >
                  <FaDownload className="inline mr-1" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integrity Warning Modal */}
      {modalOpen && (
        <Modal
          title="Warning: File Integrity Failed!"
          description="This file may have been tampered with. Proceed at your own risk."
          onConfirm={proceedWithDownload}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Vault;
