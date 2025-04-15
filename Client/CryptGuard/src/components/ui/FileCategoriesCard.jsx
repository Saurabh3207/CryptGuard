import {
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileArchive,
  FaFileExcel,
  FaFileWord,
  FaFilePowerpoint,
  FaFileCode,
  FaFile,
} from "react-icons/fa";

const categories = [
  { name: "Documents", icon: <FaFileAlt />, count: 12, color: "bg-blue-100 text-blue-700" },
  { name: "Images", icon: <FaFileImage />, count: 8, color: "bg-pink-100 text-pink-600" },
  { name: "PDFs", icon: <FaFilePdf />, count: 5, color: "bg-red-100 text-red-600" },
  { name: "Archives", icon: <FaFileArchive />, count: 3, color: "bg-yellow-100 text-yellow-600" },
  { name: "Spreadsheets", icon: <FaFileExcel />, count: 4, color: "bg-green-100 text-green-600" },
  { name: "Presentations", icon: <FaFilePowerpoint />, count: 2, color: "bg-orange-100 text-orange-600" },
  { name: "Code Files", icon: <FaFileCode />, count: 6, color: "bg-indigo-100 text-indigo-600" },
  { name: "Others", icon: <FaFile />, count: 1, color: "bg-gray-200 text-gray-700" },
];

const FileCategoriesCard = () => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">📁 File Categories</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-4 py-2 rounded-lg bg-white shadow-sm border hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-full text-lg ${cat.color}`}>
                {cat.icon}
              </span>
              <span className="font-medium text-gray-700">{cat.name}</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
              {cat.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileCategoriesCard;
