const express = require('express')
const { importAll, getFiles, getDataByFolderIdAndFileName, updateValues, createFolderAndFile, getFoldersWithFiles } = require('./controller')
const router = express.Router();

router.post('/import', importAll);
router.get('/get_files', getFiles);
router.get('/fetch_data_by_file/:file_id', getDataByFolderIdAndFileName)
router.post('/update_values', updateValues)


router.post('/createFile', createFolderAndFile);
router.get('/files', getFoldersWithFiles);

module.exports = router;