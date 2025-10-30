import { useEffect, useState } from "react";
import { FaFolderOpen, FaHdd, FaShieldAlt } from "react-icons/fa"; // ✅ Correct icons from fa
import { useWeb3Context } from "../../contexts/useWeb3Context";
import axios from "axios";
import CountUp from "react-countup";

const FileStatsCard = () => {
  const { web3State } = useWeb3Context();
  const { selectedAccount } = web3State;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedAccount) return;
      try {
        // ✅ Tokens sent automatically via HttpOnly cookies
        const res = await axios.get(
          `http://localhost:3000/api/files/user/${selectedAccount}`,
          {
            withCredentials: true // Enable cookies
          }
        );

        const totalFiles = res.data.files.length || 0;
        const totalStorageMB = (
          res.data.files.reduce((acc, file) => acc + (file.fileSize || 0), 0) /
          (1024 * 1024)
        ).toFixed(2);

        const fetchedStats = [
          {
            icon: <FaFolderOpen />,
            label: "Total Files",
            value: totalFiles,
            tooltip: "Total number of uploaded files",
          },
          {
            icon: <FaHdd />,
            label: "Used Storage",
            value: totalStorageMB,
            suffix: "MB",
            tooltip: "Total storage used",
          },
        ];

        setStats(fetchedStats);
      } catch (error) {
        console.error("Error fetching file stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedAccount]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between h-full">
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white p-2 rounded-full">
          <FaFolderOpen />
        </span>
        File Statistics
      </h3>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gradient-to-br hover:from-violet-500 hover:to-indigo-600 transition-all duration-300"
              title={stat.tooltip}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl text-indigo-600 group-hover:text-white">
                  {stat.icon}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-white">
                  {stat.label}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 group-hover:text-white">
                <CountUp
                  end={parseFloat(stat.value)}
                  duration={1}
                  suffix={` ${stat.suffix || ""}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decorative Blockchain Security Section */}
      <div className="mt-6 bg-violet-50 p-4 rounded-lg flex items-center justify-center gap-3 text-violet-700 text-sm font-medium">
        <FaShieldAlt className="text-violet-500 text-xl" />
        Uploaded Securely on Blockchain
      </div>
    </div>
  );
};

export default FileStatsCard;
