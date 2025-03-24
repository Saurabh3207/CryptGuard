import axios from 'axios';
import { useState } from 'react';

const UploadFile = () => {
const [file, setFile] = useState(null);
const handleFileUpload = async() => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `http://localhost:3000/api/uploadFile`;
    const res = await axios.post(url,formData);
    console.log(res.data);
}
console.log(file);
    return ( 
       <>
         <input type="file" onChange={(e) => setFile(e.target.files[0])} />
       <button onClick={handleFileUpload}>Upload File</button> 
       </>
     );
}
 
export default UploadFile;