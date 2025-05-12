const express = require('express')
const { importAll, getFiles, getDataByFolderIdAndFileName, updateValues } = require('./controller')
const router = express.Router();

router.post('/import', importAll);
router.get('/get_files', getFiles);
router.get('/fetch_data_by_file/:folder_id/:file_name', getDataByFolderIdAndFileName)
router.post('/update_values', updateValues)


module.exports = router;