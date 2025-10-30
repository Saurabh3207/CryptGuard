import axios from "axios";
import { useState, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useWeb3Context } from "../contexts/useWeb3Context";
import logger from "../utils/logger";

const UploadFile = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const { web3State } = useWeb3Context();
  const { selectedAccount, contractInstance } = web3State;

  const getFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return (
      "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    );
  };

  const handleUploadStart = async (selectedFile) => {
    if (!selectedFile || !selectedAccount) {
      toast.error("Please select a file and connect your wallet.");
      return;
    }

    // File size validation
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("❌ File size exceeds 5MB limit.");
      return;
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/wav'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("❌ Invalid file type. Please upload a supported file format.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const fileHash = await getFileHash(selectedFile);
      
      // Check if file already exists on blockchain
      if (contractInstance) {
        try {
          const userFiles = await contractInstance.viewFiles();
          const fileExists = userFiles.some(
            f => f.fileHash.toLowerCase() === fileHash.toLowerCase()
          );
          
          if (fileExists) {
            toast.error(
              "This file already exists in your vault!\n\n" +
              "The blockchain detected that you've already uploaded this exact file. " +
              "Each unique file can only be uploaded once.",
              {
                duration: 5000,
                icon: "⚠️",
                style: {
                  maxWidth: "500px"
                }
              }
            );
            setUploading(false);
            resetForm();
            return;
          }
        } catch (checkError) {
          // If check fails, continue with upload attempt
          logger.warn("Could not check for duplicate file", checkError);
        }
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("address", selectedAccount);
      formData.append("fileHash", fileHash);

      // Step 1: Upload file to IPFS and get CIDs
      // ✅ Tokens sent automatically via HttpOnly cookies
      const preRes = await axios.post(
        "http://localhost:3000/api/preUpload",
        formData,
        {
          withCredentials: true, // Enable cookies
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          },
        }
      );

      const { ipfsCID, metadataCID } = preRes.data;

      // Step 2: Send to blockchain with proper gas estimation
      toast.loading("Preparing blockchain transaction...", { id: "metamask" });
      try {
        // Estimate gas before sending transaction
        const gasEstimate = await contractInstance.uploadFile.estimateGas(ipfsCID, fileHash);
        logger.debug("⛽ Estimated gas:", gasEstimate.toString());
        
        toast.loading("Waiting for blockchain confirmation...", { id: "metamask" });
        
        // Send transaction with gas limit (add 20% buffer)
        const tx = await contractInstance.uploadFile(ipfsCID, fileHash, {
          gasLimit: (gasEstimate * 120n) / 100n // 20% buffer
        });
        
        logger.debug("📝 Transaction sent:", tx.hash);
        toast.loading(`Transaction submitted: ${tx.hash.slice(0, 10)}...`, { id: "metamask" });
        
        // Wait for confirmation
        const receipt = await tx.wait(1); // Wait for 1 confirmation
        
        logger.debug("✅ Transaction confirmed:", {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status
        });
        
        toast.dismiss("metamask");
        
        // Check transaction status
        if (receipt.status === 0) {
          throw new Error("Transaction failed on blockchain");
        }
        
        toast.success("✅ File recorded on blockchain");

        // Step 3: Save metadata to DB with blockchain transaction hash
        await axios.post(
          "http://localhost:3000/api/confirmUpload",
          {
            address: selectedAccount,
            ipfsCID,
            metadataCID,
            fileHash,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            blockchainTxHash: receipt.hash, // Use receipt hash
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
          },
          {
            withCredentials: true // Enable cookies
          }
        );

        toast.success("✅ Upload completed successfully!");
        setProgress(100);
      } catch (txError) {
        toast.dismiss("metamask");

        // Check if it's a "File already exists" error
        if (txError.reason === "File already exists" || 
            txError.message?.includes("File already exists") ||
            (txError.code === "CALL_EXCEPTION" && txError.revert?.args?.[0] === "File already exists")) {
          
          toast.error(
            "This file already exists on the blockchain!\n\n" +
            "The smart contract detected that this exact file (based on its hash) has already been uploaded. " +
            "Each unique file can only be uploaded once to prevent duplicates.",
            {
              duration: 6000,
              icon: "⚠️",
              style: {
                maxWidth: "500px"
              }
            }
          );
          
          logger.warn("Duplicate file upload attempt", { 
            fileHash, 
            fileName: selectedFile.name,
            error: txError.reason 
          });
          return;
        }

        // Handle EIP-1193 errors
        if (txError.code === 4001 || txError.message?.toLowerCase().includes("user denied")) {
          toast.error("❌ Transaction rejected in MetaMask.");
        } else if (txError.code === -32603) {
          toast.error("❌ Transaction failed: " + (txError.message || "Internal error"));
        } else if (txError.message?.includes("insufficient funds")) {
          toast.error("❌ Insufficient funds for gas");
        } else {
          logger.error("Blockchain TX error:", txError);
          toast.error("❌ Failed to record on blockchain: " + (txError.reason || txError.message));
        }
        return;
      }

    } catch (error) {
      logger.error("Upload failed:", error);
      
      // Handle duplicate file error (409 Conflict)
      if (error.response && error.response.status === 409) {
        toast.error("⚠️ This file has already been uploaded. Each file can only be uploaded once.");
      } else if (error.response && error.response.data && error.response.data.message) {
        // Show server error message
        toast.error(`❌ ${error.response.data.message}`);
      } else {
        // Generic error
        toast.error("❌ Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      resetForm();
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile?.type?.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    handleUploadStart(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);

    if (droppedFile?.type?.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(droppedFile);
    } else {
      setPreview(null);
    }

    handleUploadStart(droppedFile);
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`w-full min-h-48 flex flex-col items-center justify-center border-2 rounded-xl transition-all duration-300 ease-in-out ${
        dragOver
          ? "border-white bg-white/10 scale-[1.01] shadow-xl"
          : "border-dashed border-white/30 hover:scale-[1.01] hover:shadow-lg"
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
    >
      <Toaster position="top-right" />
      <input
        type="file"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        accept="*"
      />

      <div className="text-center text-white space-y-3 px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-1">
          <i className="fas fa-cloud-upload-alt text-4xl group-hover:scale-110 transition-transform duration-300" />
          <p className="text-base sm:text-lg font-medium">Drag and drop your file here</p>
          <span className="text-sm text-indigo-200">or</span>
          <button
            onClick={() => fileInputRef.current.click()}
            className="mt-1 px-4 py-2 bg-white text-violet-600 font-medium rounded-md hover:bg-violet-50 transition"
          >
            Browse Files
          </button>
        </div>

        {preview && (
          <div className="mt-4">
            <p className="text-sm text-indigo-200 mb-1">Preview:</p>
            <img
              src={preview}
              alt="preview"
              className="h-32 w-auto object-contain mx-auto border rounded shadow"
            />
          </div>
        )}

        {uploading && (
          <div className="w-full mt-4">
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-indigo-100 mt-1">{progress}% uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFile;
