const express = require('express')
const { importAll, getFiles, getDataByFolderIdAndFileName, updateValues, addNewRow, updateData, getFoldersWithFiles, getProcessedDataByFileId } = require('./controller')
const router = express.Router();

router.post('/import', importAll);
router.get('/get_files', getFiles);
router.get('/fetch_data_by_file/:file_id', getDataByFolderIdAndFileName)
router.post('/update_values', updateValues)
router.post('/addNewRow', addNewRow);
router.put('/updateData', updateData);
router.get('/files', getFoldersWithFiles);
router.get('/get_processed_data/:file_id', getProcessedDataByFileId);

module.exports = router;
