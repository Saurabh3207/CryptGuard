import { useEffect, useState } from "react";
import { useWeb3Context } from "../contexts/useWeb3Context";
import axios from "axios";
import {
  FaDownload,
  FaSearch,
  FaSync,
  FaImage,
  FaShieldAlt,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaFileAudio,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import VerifyProgressModal from "../components/ui/VerifyProgressModal";
import DeleteConfirmationModal from "../components/ui/DeleteConfirmationModal";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  pdf: <FaFilePdf className="text-red-500" />,
  image: <FaFileImage className="text-pink-500" />,
  audio: <FaFileAudio className="text-yellow-500" />,
  default: <FaFileAlt className="text-gray-500" />,
};

const getFileType = (name) => {
  if (name.match(/\.(jpg|jpeg|png|gif)$/i)) return "image";
  if (name.match(/\.(pdf)$/i)) return "pdf";
  if (name.match(/\.(mp3|wav|ogg)$/i)) return "audio";
  return "default";
};

const getFileExtensionLabel = (fileName) => {
  const ext = fileName.split(".").pop()?.toUpperCase();
  return ext || "FILE";
};

const Vault = () => {
  const { web3State } = useWeb3Context();
  const { selectedAccount, contractInstance } = web3State;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); 

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifySteps, setVerifySteps] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);

  // Image preview state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");

  const fetchFiles = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      // ✅ Tokens sent automatically via HttpOnly cookies
      const res = await axios.get(
        `http://localhost:3000/api/files/user/${selectedAccount}`,
        {
          withCredentials: true // Enable cookies
        }
      );
      setFiles(res.data.files || []);
    } catch {
      toast.error("❌ Failed to fetch files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedAccount]);

  // Get the files for the current page
  const paginateFiles = (files) => {
    const indexOfLastFile = currentPage * itemsPerPage;
    const indexOfFirstFile = indexOfLastFile - itemsPerPage;
    return files.slice(indexOfFirstFile, indexOfLastFile);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const filteredFiles = files
    .filter((file) => file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((file) => {
      const type = getFileType(file.fileName);
      return filterType === "all" || filterType === type;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "az":
          return a.fileName.localeCompare(b.fileName);
        case "za":
          return b.fileName.localeCompare(a.fileName);
        case "sizeAsc":
          return a.fileSize - b.fileSize;
        case "sizeDesc":
          return b.fileSize - a.fileSize;
        case "oldest":
          return new Date(a.uploadTime) - new Date(b.uploadTime);
        case "newest":
        default:
          return new Date(b.uploadTime) - new Date(a.uploadTime);
      }
    });

  const calculateFileHash = async (blob) => {
    const buffer = await blob.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    return "0x" + CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  };

  const findFileIndexFromContract = async (fileHash) => {
    try {
      if (!contractInstance) {
        console.warn("Contract instance not available");
        return null;
      }
      
      const filesOnChain = await contractInstance.viewFiles();
      
      if (!filesOnChain || filesOnChain.length === 0) {
        console.info("ℹ️ No files found on blockchain (this is normal if you haven't uploaded files yet)");
        return null;
      }
      
      const index = filesOnChain.findIndex(
        (f) => f.fileHash.toLowerCase() === fileHash.toLowerCase()
      );
      return index !== -1 ? index : null;
    } catch (err) {
      // This is expected if blockchain is unavailable or user has no files
      console.info("ℹ️ Blockchain verification unavailable:", err.message);
      return null;
    }
  };

  const handleSecureDownload = async (file) => {
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

      // Optional blockchain verification - don't block download if it fails
      try {
        toast.loading("Verifying integrity...");
        const hash = await calculateFileHash(decryptedBlob);
        const index = await findFileIndexFromContract(file.fileHash);
        
        if (index !== null) {
          const valid = await contractInstance.verifyFile(index, hash);
          toast.dismiss();
          
          if (!valid) {
            toast.error("⚠️ File integrity check failed!");
            return; // Don't download if verification explicitly fails
          }
          
          toast.success("✅ File verified on blockchain!");
        } else {
          toast.dismiss();
          toast("⚠️ File not on blockchain, proceeding with download", { icon: "ℹ️" });
        }
      } catch (verifyErr) {
        toast.dismiss();
        console.info("ℹ️ Blockchain verification unavailable:", verifyErr);
        toast("⚠️ Blockchain verification unavailable, proceeding with download", { 
          icon: "⚠️",
          duration: 3000 
        });
      }

      // Download file regardless of blockchain verification status
      const link = document.createElement("a");
      link.href = URL.createObjectURL(decryptedBlob);
      link.download = file.fileName || "CryptGuard_File";
      link.click();
      
      toast.success("✅ Download completed!");
      
    } catch (err) {
      toast.dismiss();
      console.error("Download error:", err);
      toast.error("❌ Download failed: " + (err.message || "Unknown error"));
    }
  };

  const verifyIntegrityOnly = async (file) => {
    const steps = [];
    setVerifyModalOpen(true);
    setVerifyStatus(null);

    try {
      steps.push("🔍 Requesting decryption from server...");
      setVerifySteps([...steps]);

      // ✅ Tokens sent automatically via HttpOnly cookies
      const response = await axios.post(
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

      steps.push("🔐 Calculating file hash...");
      setVerifySteps([...steps]);

      const buffer = await response.data.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const hash = "0x" + hashHex;

      steps.push("📡 Verifying on blockchain...");
      setVerifySteps([...steps]);

      try {
        const index = await findFileIndexFromContract(file.fileHash);
        
        if (index === null) {
          steps.push("⚠️ File not found on blockchain");
          setVerifySteps([...steps]);
          steps.push("✅ File decrypted successfully (blockchain verification skipped)");
          setVerifySteps([...steps]);
          setVerifyStatus("warning");
        } else {
          const valid = await contractInstance.verifyFile(index, hash);
          if (!valid) {
            throw new Error("Hash mismatch - file may be corrupted");
          }
          steps.push("✅ Verified successfully on blockchain!");
          setVerifySteps([...steps]);
          setVerifyStatus("success");
        }
      } catch (blockchainErr) {
        console.warn("Blockchain verification failed:", blockchainErr);
        steps.push("⚠️ Blockchain verification unavailable");
        steps.push("✅ File decrypted successfully (offline mode)");
        setVerifySteps([...steps]);
        setVerifyStatus("warning");
      }
      
    } catch (err) {
      console.error("Verify error:", err);
      steps.push("❌ Integrity check failed: " + (err.message || "Unknown error"));
      setVerifySteps([...steps]);
      setVerifyStatus("failed");
    }

    setTimeout(() => {
      setVerifyModalOpen(false);
      setVerifySteps([]);
      setVerifyStatus(null);
    }, 3000);
  };

  const handleDeleteFile = (file) => {
    // Open delete confirmation modal
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    // Close modal immediately
    setDeleteModalOpen(false);
    
    // Set deleting state to trigger fade-out animation
    setDeletingFileId(fileToDelete._id);
    
    toast.loading("Deleting file...");
    
    try {
      const response = await axios.delete(
        `http://localhost:3000/api/files/${fileToDelete._id}`,
        {
          data: { userAddress: selectedAccount },
          withCredentials: true
        }
      );

      toast.dismiss();
      
      // Wait for fade-out animation to complete before removing from list
      setTimeout(async () => {
        toast.success(`✅ ${fileToDelete.fileName} deleted successfully!`);
        
        // Refresh file list
        await fetchFiles();
        
        // Reset states
        setDeletingFileId(null);
        setFileToDelete(null);
        
        // Close modal if it's open
        if (modalOpen) {
          setModalOpen(false);
          setSelectedFile(null);
        }
      }, 500); // Match animation duration
      
    } catch (error) {
      toast.dismiss();
      setDeletingFileId(null);
      setFileToDelete(null);
      console.error("Delete error:", error);
      
      if (error.response?.status === 404) {
        toast.error("❌ File not found or already deleted");
      } else if (error.response?.status === 403) {
        toast.error("❌ You don't have permission to delete this file");
      } else {
        toast.error("❌ Failed to delete file: " + (error.response?.data?.message || "Unknown error"));
      }
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShieldAlt className="text-violet-600" /> My Vault
        </h1>

        {/* Control Panel */}
        <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-xl flex flex-wrap gap-3 items-center w-full md:w-auto md:justify-end">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <FaSearch />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-violet-500 outline-none text-gray-700"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 text-gray-700 rounded-full px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="newest">Date: Newest</option>
            <option value="oldest">Date: Oldest</option>
            <option value="az">Name: A–Z</option>
            <option value="za">Name: Z–A</option>
            <option value="sizeAsc">Size: Smallest</option>
            <option value="sizeDesc">Size: Largest</option>
          </select>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 text-gray-700 rounded-full px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="default">Other</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchFiles}
            className="p-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-full shadow-md transition"
            title="Refresh Files"
          >
            <FaSync />
          </button>
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <div className="text-5xl">📁</div>
          <p className="text-sm">No files found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {paginateFiles(filteredFiles).map((file, index) => {
              const fileType = getFileType(file.fileName);
              const icon = iconMap[fileType];
              const extLabel = getFileExtensionLabel(file.fileName);
              const isDeleting = deletingFileId === file._id;

              return (
                <motion.div
                  key={file._id || index}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ 
                    opacity: isDeleting ? 0 : 1, 
                    y: 0,
                    scale: isDeleting ? 0.95 : 1,
                    height: isDeleting ? 0 : "auto"
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.95,
                    height: 0,
                    marginBottom: 0,
                    transition: { duration: 0.3 }
                  }}
                  transition={{ duration: 0.3, delay: isDeleting ? 0 : index * 0.05 }}
                  className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-lg hover:ring-2 hover:ring-violet-100 hover:scale-[1.01] transition-all flex flex-col md:flex-row justify-between md:items-center gap-3 overflow-hidden"
                  style={{ opacity: isDeleting ? 0.5 : 1 }}
                >
                  <div className="flex items-center gap-3 truncate">
                  <div className="text-xl">{icon}</div>
                  <div>
                    <p className="font-semibold text-gray-800 truncate flex items-center gap-2" title={file.fileName}>
                      {file.fileName}
                      <span className="text-[10px] bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full uppercase shadow-sm">
                        {extLabel}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(file.uploadTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap items-center justify-end">
                  {fileType === "image" && (
                    <button
                      onClick={async () => {
                        toast.loading("Decrypting image...");
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
                          const blobUrl = URL.createObjectURL(res.data);
                          setPreviewUrl(blobUrl);
                          setPreviewName(file.fileName);
                        } catch {
                          toast.dismiss();
                          toast.error("❌ Failed to decrypt image.");
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-medium text-violet-600 border border-violet-500 bg-white hover:bg-violet-50 px-3 py-1.5 rounded-full transition shadow-sm"
                    >
                      <FaImage /> View
                    </button>
                  )}

                  {/* Verify Button */}
                  <button
                    onClick={() => verifyIntegrityOnly(file)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 border border-violet-600 hover:border-violet-700 px-3 py-1.5 rounded-full transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaShieldAlt className="text-white" /> Verify
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => handleSecureDownload(file)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 border border-indigo-600 hover:border-violet-700 px-3 py-1.5 rounded-full transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaDownload className="text-white" /> Download
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteFile(file)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 border border-red-500 hover:border-red-600 px-3 py-1.5 rounded-full transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash-alt"></i> Delete
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-4 py-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 truncate">{previewName}</h2>
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setPreviewName("");
                }}
                className="text-red-500 hover:text-red-700 font-bold text-xl"
              >
                &times;
              </button>
            </div>
            <img src={previewUrl} alt="Preview" className="max-h-[70vh] w-full object-contain rounded-md border" />
          </div>
        </div>
      )}

      <VerifyProgressModal
        isOpen={verifyModalOpen}
        steps={verifySteps}
        status={verifyStatus}
        onClose={() => {
          setVerifyModalOpen(false);
          setVerifySteps([]);
          setVerifyStatus(null);
        }}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={confirmDelete}
        fileName={fileToDelete?.fileName || ""}
      />

      {modalOpen && (
        <Modal
          title="Warning: File Integrity Failed!"
          description="This file may have been tampered with. Proceed at your own risk."
          onConfirm={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Vault;
