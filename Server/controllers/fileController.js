const FileMapping = require("../models/FileMapping");

// Get recent uploaded files by a user
async function getUserFiles(req, res) {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required." });
    }

    const files = await FileMapping.find({ userAddress: walletAddress.toLowerCase() })
      .sort({ uploadTime: -1 }) // Latest first
      .limit(10); // Limit to 10 recent uploads

    return res.status(200).json({ files });
  } catch (error) {
    console.error("Error fetching user files:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

// Get file statistics for a user
async function getFileStats(req, res) {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required." });
    }

    const files = await FileMapping.find({ userAddress: walletAddress.toLowerCase() });

    const stats = {
      totalFiles: files.length,
      totalStorageMB: files.reduce((acc, file) => acc + (file.fileSize || 0), 0) / (1024 * 1024),
      categories: {
        Documents: 0,
        Images: 0,
        PDFs: 0,
        Archives: 0,
        Spreadsheets: 0,
        Presentations: 0,
        CodeFiles: 0,
        Others: 0,
      },
    };

    // Categorize based on file extension
    files.forEach(file => {
      const name = file.fileName?.toLowerCase() || "";
      if (name.endsWith(".doc") || name.endsWith(".docx") || name.endsWith(".txt")) {
        stats.categories.Documents++;
      } else if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif")) {
        stats.categories.Images++;
      } else if (name.endsWith(".pdf")) {
        stats.categories.PDFs++;
      } else if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z")) {
        stats.categories.Archives++;
      } else if (name.endsWith(".xls") || name.endsWith(".xlsx") || name.endsWith(".csv")) {
        stats.categories.Spreadsheets++;
      } else if (name.endsWith(".ppt") || name.endsWith(".pptx")) {
        stats.categories.Presentations++;
      } else if (name.endsWith(".js") || name.endsWith(".py") || name.endsWith(".html") || name.endsWith(".css")) {
        stats.categories.CodeFiles++;
      } else {
        stats.categories.Others++;
      }
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching file stats:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

module.exports = { getUserFiles, getFileStats };
