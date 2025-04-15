import {
  FaClock,
  FaFilePdf,
  FaFileImage,
  FaFileAudio,
  FaFileAlt,
  FaDownload,
} from "react-icons/fa";
import { useEffect, useState } from "react";

const iconMap = {
  pdf: <FaFilePdf className="text-red-500 text-lg" />,
  image: <FaFileImage className="text-pink-500 text-lg" />,
  audio: <FaFileAudio className="text-yellow-500 text-lg" />,
  text: <FaFileAlt className="text-blue-500 text-lg" />,
  default: <FaFileAlt className="text-gray-500 text-lg" />,
};

const RecentUploadsCard = () => {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setFiles([
        { name: "contract.pdf", type: "pdf", size: "1.2MB", time: "2 mins ago" },
        { name: "profile.png", type: "image", size: "800KB", time: "5 mins ago" },
        { name: "song.mp3", type: "audio", size: "3.4MB", time: "10 mins ago" },
      ]);
      setLoading(false);
    }, 1500);
  }, []);

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
            {files.map((file, index) => {
              const icon = iconMap[file.type] || iconMap.default;
              return (
                <li
                  key={index}
                  className="flex items-center justify-between px-4 py-2 rounded-lg border hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-3 truncate">
                    {icon}
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {file.size} • {file.time}
                      </span>
                    </div>
                  </div>
                  <button
                    title="Download"
                    className="text-gray-400 hover:text-indigo-500 transition text-sm"
                  >
                    <FaDownload />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* View All Footer Link */}
      {!loading && files.length > 0 && (
        <div className="mt-4 text-right">
          <button className="text-sm font-medium text-violet-600 hover:underline hover:text-violet-800 transition">
            View All
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentUploadsCard;
