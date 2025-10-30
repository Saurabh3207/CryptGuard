const FileMapping = require('../models/FileMapping');
const { PINATA_JWT } = require('../config/serverConfig');
const { logger } = require('../utils/logger');
const axios = require('axios');

/**
 * Delete file from MongoDB, IPFS (Pinata), and mark as deleted
 * Note: Cannot delete from blockchain (immutable), but we remove from our DB
 */
async function deleteFileController(req, res) {
  try {
    const { fileId } = req.params;
    const { userAddress } = req.body;

    if (!fileId || !userAddress) {
      return res.status(400).json({ 
        message: 'File ID and user address are required' 
      });
    }

    const normalizedAddress = userAddress.toLowerCase();

    // Find file in database
    const file = await FileMapping.findOne({
      _id: fileId,
      userAddress: normalizedAddress
    });

    if (!file) {
      return res.status(404).json({ 
        message: 'File not found or you do not have permission to delete it' 
      });
    }

    // Store file info for logging
    const fileInfo = {
      fileId: file._id,
      fileName: file.fileName,
      ipfsCID: file.ipfsCID,
      metadataCID: file.metadataCID,
      fileHash: file.fileHash,
      userAddress: normalizedAddress
    };

    // Step 1: Unpin file from IPFS (Pinata)
    let ipfsUnpinSuccess = false;
    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${file.ipfsCID}`,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`
          }
        }
      );
      ipfsUnpinSuccess = true;
      logger.info('File unpinned from IPFS', { ipfsCID: file.ipfsCID });
    } catch (ipfsError) {
      logger.warn('Failed to unpin file from IPFS', { 
        error: ipfsError.message, 
        ipfsCID: file.ipfsCID 
      });
      // Continue with deletion even if IPFS unpin fails
    }

    // Step 2: Unpin metadata from IPFS (Pinata)
    let metadataUnpinSuccess = false;
    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${file.metadataCID}`,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`
          }
        }
      );
      metadataUnpinSuccess = true;
      logger.info('Metadata unpinned from IPFS', { metadataCID: file.metadataCID });
    } catch (metadataError) {
      logger.warn('Failed to unpin metadata from IPFS', { 
        error: metadataError.message, 
        metadataCID: file.metadataCID 
      });
      // Continue with deletion even if metadata unpin fails
    }

    // Step 3: Remove from MongoDB
    await FileMapping.deleteOne({ _id: fileId });

    // Log audit trail
    logger.audit('File deleted', {
      ...fileInfo,
      ipfsUnpinSuccess,
      metadataUnpinSuccess,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      message: 'File deleted successfully',
      details: {
        fileName: file.fileName,
        ipfsUnpinned: ipfsUnpinSuccess,
        metadataUnpinned: metadataUnpinSuccess,
        note: 'Blockchain record is immutable and cannot be deleted, but file is removed from your vault'
      }
    });

  } catch (error) {
    logger.error('File deletion failed', { 
      error: error.message, 
      fileId: req.params.fileId 
    });
    res.status(500).json({ 
      message: 'Failed to delete file',
      error: error.message 
    });
  }
}

module.exports = { deleteFileController };
