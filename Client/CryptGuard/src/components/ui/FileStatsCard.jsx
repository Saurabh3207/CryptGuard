import { useEffect, useState } from "react";
import { FaFolderOpen, FaHdd, FaCloudUploadAlt } from "react-icons/fa";
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
        const res = await axios.get(
          `http://localhost:3000/api/files/stats/${selectedAccount}`
        );
        const fetchedStats = [
          {
            icon: <FaFolderOpen />,
            label: "Total Files",
            value: res.data.totalFiles || 0,
            tooltip: "Total number of uploaded files",
          },
          {
            icon: <FaHdd />,
            label: "Used Storage",
            value: (res.data.totalStorageMB || 0).toFixed(2),
            suffix: "MB",
            tooltip: "Current storage usage",
          },
          {
            icon: <FaCloudUploadAlt />,
            label: "Upload Speed",
            value: 2,
            suffix: "s",
            tooltip: "Estimated average upload time",
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
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white p-2 rounded-full">
          <FaFolderOpen />
        </span>
        File Statistics
      </h3>

      {/* Skeleton loader */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ) : (
        <>
          {/* 1st stat full width */}
          <div
            className="group p-4 mb-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gradient-to-br hover:from-violet-500 hover:to-indigo-600 transition-all duration-300"
            title={stats[0]?.tooltip}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl text-indigo-600 group-hover:text-white">
                {stats[0]?.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-white">
                {stats[0]?.label}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 group-hover:text-white">
              <CountUp end={parseFloat(stats[0]?.value)} duration={1} />
            </div>
          </div>

          {/* Remaining stats in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.slice(1).map((stat, idx) => (
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
        </>
      )}
    </div>
  );
};

export default FileStatsCard;
