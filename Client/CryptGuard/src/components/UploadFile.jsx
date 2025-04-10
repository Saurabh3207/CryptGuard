import axios from "axios";
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useWeb3Context } from "../contexts/useWeb3Context";

const UploadFile = () => {
  const [file, setFile] = useState(null);
  const { web3State } = useWeb3Context();
  const { selectedAccount, contractInstance } = web3State;

  // 🔐 Hash file in browser using SHA-256
  const getFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return (
      "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    );
  };

  const handleFileUpload = async () => {
    if (!file || !selectedAccount) {
      toast.error("Please select a file and connect your wallet.");
      return;
    }
  
    try {
      // 1️⃣ Hash the file
      const fileHash = await getFileHash(file);
  
      // 2️⃣ Upload file to backend
      const formData = new FormData();
      formData.append("file", file);
      formData.append("address", selectedAccount);
  
      const res = await axios.post("http://localhost:3000/api/uploadFile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      // 3️⃣ Use updated response fields
      const { encryptedFileCID, metadataCID } = res.data;
  
      // 4️⃣ Call smart contract with encrypted file CID + hash
      const tx = await contractInstance.uploadFile(encryptedFileCID, fileHash);
      await tx.wait();
  
      // 5️⃣ Success feedback
      toast.success("File uploaded & recorded on blockchain!");
  
      // ✅ Optional logs
      console.log("Encrypted File CID:", encryptedFileCID);
      console.log("Metadata CID:", metadataCID);
  
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back! Upload your files below.
        </p>
      </header>

      <div className="bg-white shadow-md border border-gray-200 rounded-lg max-w-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Upload a File
        </h2>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full"
        />
        <button
          onClick={handleFileUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Upload File
        </button>
      </div>
    </div>
  );
};

export default UploadFile;
