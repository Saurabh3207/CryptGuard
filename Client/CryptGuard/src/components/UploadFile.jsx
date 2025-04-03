import axios from 'axios';
import { useState } from 'react';
import { Toaster, toast } from "react-hot-toast";

const UploadFile = () => {
  const [file, setFile] = useState(null);

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `http://localhost:3000/api/uploadFile`;

    try {
      const res = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(res.data);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Dashboard Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back! Upload your files below.</p>
      </header>

      {/* Upload Card */}
      <div className="bg-white shadow-md border border-gray-200 rounded-lg max-w-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload a File</h2>

        <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
        />

        <button
          onClick={handleFileUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Upload File
        </button>
      </div>
    </div>
  );
}

export default UploadFile;

