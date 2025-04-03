import axios from 'axios';
import { useState } from 'react';

const UploadFile = () => {
  const [file, setFile] = useState(null);

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file); // Append the file to FormData
    const url = `http://localhost:3000/api/uploadFile`; // Backend endpoint

    try {
      const res = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Ensure correct content type
        },
      });
      console.log(res.data);  // Handle successful upload
    } catch (error) {
      console.error("Error uploading file:", error);  // Handle error
    }
  };

  return (
    <>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleFileUpload}>Upload File</button>
    </>
  );
}

export default UploadFile;
